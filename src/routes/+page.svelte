<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { Music, Play, Pause } from 'lucide-svelte';

    interface Track {
        id: string;
        title: string;
        artist: string;
        album: string;
        duration: number;
        filepath: string;
    }

    let tracks: Track[] = [];
    let currentTrack: Track | null = null;
    let audio: HTMLAudioElement | undefined;
    let isPlaying = false;
    let progress = 0;
    let duration = 0;
    let volume = 0.5; // Default volume value

    // Reactive declarations
    $: {
        const playParam = $page.url.searchParams.get('play') === 'true';
        if (audio) {
            if (playParam) {
                audio
                    .play()
                    .catch((error) =>
                        console.error('Error playing audio:', error)
                    );
            } else {
                audio.pause();
            }
        }
        isPlaying = playParam;
    }

    $: {
        const volumeParam = parseFloat(
            $page.url.searchParams.get('volume') || `${volume}`
        );
        volume = Math.min(Math.max(volumeParam, 0), 1); // Clamp volume between 0 and 1
        if (audio) {
            audio.volume = volume; // Update audio element volume
        }
    }

    onMount(async () => {
        try {
            const response = await fetch('/api/tracks');
            if (response.ok) {
                tracks = await response.json();
            } else {
                console.error('Failed to fetch tracks');
            }
        } catch (error) {
            console.error('Error fetching tracks:', error);
        }

        // Initialize audio element
        audio = new Audio();
        audio.volume = volume; // Set initial volume
        audio.addEventListener('timeupdate', () => {
            if (audio) {
                progress = (audio.currentTime / audio.duration) * 100;
            }
        });
        audio.addEventListener('ended', () => {
            const currentIndex = tracks.findIndex(
                (t) => t.id === currentTrack?.id
            );
            if (currentIndex < tracks.length - 1) {
                playTrack(tracks[currentIndex + 1]);
            }
        });
    });

    function formatDuration(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function playTrack(track: Track): void {
        if (!audio) return;

        const params = new URLSearchParams();

        if (currentTrack?.id === track.id && isPlaying) {
            // If the same track is already playing, pause it
            params.set('play', 'false');
            goto(`?${params.toString()}`, { replaceState: true });
            audio.pause();
            return;
        }

        // Otherwise, play the selected track
        params.set('track', track.title);
        params.set('play', 'true');
        params.set('volume', volume.toFixed(2)); // Add volume to search params

        goto(`?${params.toString()}`);

        if (currentTrack?.id !== track.id) {
            currentTrack = track;
            audio.src = track.filepath;
            duration = track.duration;
        }

        audio
            .play()
            .catch((error) => console.error('Error playing audio:', error));
    }

    function togglePlayPause(): void {
        const params = new URLSearchParams($page.url.searchParams);
        params.set('play', isPlaying ? 'false' : 'true');
        goto(`?${params.toString()}`, { replaceState: true }); // Update URL without reloading
    }

    function updateVolume(newVolume: number): void {
        volume = Math.min(Math.max(newVolume, 0), 1); // Clamp volume between 0 and 1
        if (audio) {
            audio.volume = volume; // Update audio element volume
        }
        const params = new URLSearchParams($page.url.searchParams);
        params.set('volume', volume.toFixed(2)); // Update volume in search params
        goto(`?${params.toString()}`, { replaceState: true }); // Update URL without reloading
    }
</script>

<div class="space-y-6">
    <h1 class="text-2xl font-bold">Your Library</h1>

    <div
        class="grid grid-cols-[auto,1fr,auto] gap-4 text-sm font-medium text-muted-foreground"
    >
        <div class="w-8 pl-4">#</div>
        <div>Title</div>
        <div class="pr-4">Duration</div>
    </div>

    <div class="space-y-1">
        {#each tracks as track, i}
            <button
                class="w-full grid grid-cols-[auto,1fr,auto] gap-4 px-4 py-2 hover:bg-accent rounded-md text-left items-center"
                class:text-primary={currentTrack?.id === track.id}
                on:click={() => playTrack(track)}
            >
                <div class="w-8">
                    {#if currentTrack?.id === track.id && isPlaying}
                        <Pause size={16} />
                    {:else}
                        {i + 1}
                    {/if}
                </div>
                <div>
                    <div class="font-medium">{track.title}</div>
                    <div class="text-sm text-muted-foreground">
                        {track.artist}
                    </div>
                </div>
                <div>{formatDuration(track.duration)}</div>
            </button>
        {/each}
    </div>
</div>

<svelte:head>
    <title>{currentTrack ? currentTrack.title : 'Spotipi'}</title>
</svelte:head>
