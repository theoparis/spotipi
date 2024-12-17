<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import {
        Library,
        Play,
        Pause,
        Volume2,
        GripVertical,
        Search
    } from 'lucide-svelte';

    let isDark = true;
    let sidebarWidth = 256;
    let isResizing = false;
    let audio: HTMLAudioElement | null = null;
    let searchQuery = '';
    let volume = 0.5;
    let playlist = ['cool tunes', 'ima sadboy', 'baller', 'workout playlist'];
    let filteredPlaylist = playlist;

    $: trackParam = $page.url.searchParams.get('track') || '';
    $: isPlaying = $page.url.searchParams.get('play') === 'true';

    $: filteredPlaylist = playlist.filter((track) =>
        track.toLowerCase().includes(searchQuery.toLowerCase())
    );

    $: {
        let volume = parseFloat($page.url.searchParams.get('volume') || '0.5');
        volume = Math.min(Math.max(volume, 0), 1);
        if (audio) audio.volume = volume; // Update audio volume when reactive value changes
    }

    onMount(() => {
        document.documentElement.classList.toggle('dark', isDark);

        // Initialize the audio element
        audio = new Audio();
        audio.volume = volume; // Set the volume based on the URL parameter
    });

    function startResize(e: MouseEvent) {
        isResizing = true;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }

    function resize(e: MouseEvent) {
        if (!isResizing) return;
        // Limit sidebar width between 200px and 400px
        sidebarWidth = Math.max(180, Math.min(400, e.clientX));
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }

    function updateVolume(newVolume: number) {
        if (audio) {
            audio.volume = newVolume; // Update the audio element's volume
        }
        const params = new URLSearchParams($page.url.searchParams);
        params.set('volume', newVolume.toFixed(2)); // Update the URL search params
        goto(`?${params.toString()}`, { replaceState: true }); // Update the URL without reloading
    }

    function togglePlayPause() {
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            updatePlayParam(false);
        } else {
            audio
                .play()
                .catch((error) => console.error('Error playing audio:', error));
            updatePlayParam(true);
        }
    }

    function updatePlayParam(play: boolean) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set('play', play ? 'true' : 'false'); // Update the play parameter
        goto(`?${params.toString()}`, { replaceState: true }); // Update URL without reloading
    }

    function selectTrack(track: string) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set('track', track);
        goto(`?${params.toString()}`, { replaceState: true });
    }
</script>

<div class="h-screen flex flex-col bg-background">
    <div class="flex flex-1 overflow-hidden">
        <!-- Resizable Sidebar -->
        <div
            class="bg-card flex flex-col gap-2 p-2 relative"
            style="width: {sidebarWidth}px;"
        >
            <div class="flex-1 bg-popover rounded-lg p-4">
                <div class="flex items-center gap-4 text-foreground mb-4">
                    <Library size={24} />
                    <span>Your Library</span>
                </div>
                <div class="mb-4">
                    <div class="flex items-center gap-2 mb-2">
                        <Search size={16} class="text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search playlists..."
                            bind:value={searchQuery}
                            class="w-full bg-background text-foreground rounded p-2"
                        />
                    </div>
                </div>
                <div class="overflow-y-auto max-h-72">
                    {#each filteredPlaylist as track}
                        <div
                            class="p-2 cursor-pointer hover:bg-primary/10 rounded text-sm"
                        >
                            {track}
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Resize Handle -->
            <div
                class="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/20 flex items-center justify-center group"
                on:mousedown={startResize}
            >
                <GripVertical
                    size={16}
                    class="text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                />
            </div>
        </div>

        <!-- Main content -->
        <main class="flex-1 overflow-y-auto p-6">
            <slot />
        </main>
    </div>

    <!-- Player controls -->
    <div class="h-20 bg-card border-t border-border p-4">
        <div class="flex items-center justify-between max-w-screen-xl mx-auto">
            <!-- Track info -->
            <div class="flex items-center gap-4 w-1/3">
                <div class="w-12 h-12 bg-accent rounded"></div>
                <div>
                    <!-- Use the dynamically updated trackParam if it's not empty -->
                    <h4 class="text-sm font-medium">
                        {trackParam || 'No track playing'}
                    </h4>
                    <p class="text-xs text-muted-foreground">
                        {trackParam
                            ? 'Playing your selected track'
                            : 'Select a track to play'}
                    </p>
                </div>
            </div>

            <!-- Playback controls -->
            <div class="flex flex-col items-center w-1/3">
                <div class="flex items-center gap-4">
                    <!-- <button class="text-foreground hover:text-primary">
            <SkipBack size={20} />
          </button> -->
                    <button
                        class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                        on:click={togglePlayPause}
                    >
                        {#if !isPlaying}
                            <Play size={16} />
                        {:else}
                            <Pause size={16} />
                        {/if}
                    </button>
                    <!-- <button class="text-foreground hover:text-primary">
            <SkipForward size={20} />
          </button> -->
                </div>
                <div class="w-full mt-2">
                    <div class="h-1 bg-secondary rounded-full">
                        <div class="h-full w-0 bg-primary rounded-full"></div>
                    </div>
                </div>
            </div>

            <!-- Volume control -->
            <div class="flex items-center gap-2 w-1/3 justify-end">
                <Volume2 size={20} />
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    class="w-24 rounded-full hue-rotate-[280deg] h-1"
                    bind:value={volume}
                    on:input={() => updateVolume(volume)}
                />
            </div>
        </div>
    </div>
</div>
