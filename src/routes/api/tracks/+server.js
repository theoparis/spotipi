import { json } from '@sveltejs/kit';
import { promises as fs } from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';

const MUSIC_DIR = 'static/music';

export async function GET() {
    try {
        const files = await fs.readdir(MUSIC_DIR);
        const tracks = await Promise.all(
            files
                .filter(
                    (file) =>
                        file.endsWith('.mp3') ||
                        file.endsWith('.flac') ||
                        file.endsWith('.opus') ||
                        file.endsWith('.wav')
                )
                .map(async (file) => {
                    const fileWithoutExtension = path.basename(
                        file,
                        path.extname(file)
                    );
                    const filePath = path.join(MUSIC_DIR, file);
                    try {
                        const metadata = await parseFile(filePath);
                        return {
                            id: file,
                            title:
                                metadata.common.title || fileWithoutExtension,
                            artist: metadata.common.artist || 'Unknown Artist',
                            album: metadata.common.album || 'Unknown Album',
                            duration: Math.floor(metadata.format.duration),
                            filepath: `/music/${file}`
                        };
                    } catch (error) {
                        console.error(
                            `Error parsing metadata for ${file}:`,
                            error
                        );
                        return {
                            id: file,
                            title: fileWithoutExtension,
                            artist: 'Unknown Artist',
                            album: 'Unknown Album',
                            duration: 0,
                            filepath: `/music/${file}`
                        };
                    }
                })
        );

        return json(tracks);
    } catch (error) {
        console.error('Error reading music directory:', error);
        return json(
            { error: 'Failed to read music directory' },
            { status: 500 }
        );
    }
}
