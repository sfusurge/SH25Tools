<script lang="ts">
    import AudioWaves from "$lib/components/beatmapper/AudioWaves.svelte";
    import BeatMapper, { type Beat } from "$lib/components/beatmapper/BeatMapper.svelte";

    let files: FileList | undefined = $state();

    let bpm = $state(30);
    let bpmOffset = $state(0);

    let beats: Beat[] = $state([]);

    let title = $state("");
    let difficulty = $state("");

    function exportMap() {
        let buffer = `# ${title}\n# ${difficulty}\n`;

        for (const b of beats.toSorted((a, b) => a.time - b.time)) {
            buffer += `${b.value},${b.time.toFixed(3)}`;

            if (b.endTime) {
                buffer += `,${(b.endTime - b.time).toFixed(3)}`; // save durationn
            }
            buffer += "\n";
        }

        const anchor = document.createElement("a");
        anchor.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(buffer));
        anchor.setAttribute("download", `${title}.beatmap`);
        anchor.style.display = "none";

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    }

    let importedFiles: FileList | undefined = $state();
    async function importMap() {
        if (importedFiles?.length !== 1) {
            importedFiles = undefined;
            return;
        }

        const f = importedFiles[0];
        const lines = (await f.text()).split("\n");
        title = lines[0].split("#")[1].trim();
        difficulty = lines[1].split("#")[1].trim();

        beats = [];

        for (let i = 2; i < lines.length; i++) {
            const [_value, _time, _duration] = lines[i].trim().split(",");
            beats.push({
                value: parseInt(_value) as unknown as 0 | 1 | 2,
                time: parseFloat(_time),
                endTime: _duration ? parseFloat(_time) + parseFloat(_duration) : undefined,
            });
        }
    }
</script>

<div class="root">
    <!-- :skull: -->
    <svelte:boundary>
        <div class="hor">
            <div class="ver">
                <label for="fileinput">Song: <input type="file" id="fileinput" bind:files /></label>
                <label for="bpmInput"
                    >Bpm: {bpm}
                    <input type="range" min="30" max="180" id="bpmInput" bind:value={bpm} /></label
                >
                <label for="offsetInput"
                    >Offset: {`${bpmOffset.toPrecision(3).padEnd(5, "0")}`}s
                    <input
                        step="any"
                        type="range"
                        min="0"
                        max="1"
                        id="offsetInput"
                        bind:value={bpmOffset}
                    /></label
                >
            </div>

            <div class="ver">
                <label for="">Title: <input type="text" bind:value={title} /></label>
                <label for=""
                    >Difficulty: <input type="text" bind:value={difficulty} />
                    <button onclick={exportMap}>Export</button></label
                >

                <label for=""
                    >Import file: <input type="file" accept=".beatmap" bind:files={importedFiles} />
                    <button onclick={importMap}>Import</button></label
                >
            </div>
        </div>
        <AudioWaves {bpm} {bpmOffset} file={(files ?? [])[0]} />
        <BeatMapper bind:beats />

        {#snippet pending()}
            Loading audio...
        {/snippet}

        {#snippet failed()}
            <h1>An error has occured, please refresh the page.... (Did you upload a invalid audio file?)</h1>
        {/snippet}
    </svelte:boundary>

    <h1>Instruction</h1>
    <ul>
        <li>Upload a Song.</li>
        <li>Scrollwheel in audio track to zoom in/out</li>
        <li>Middle mouse and drag to shift the track, or use arrow keys to shift by 1 second</li>
        <li>Left click to set play progress (orange line)</li>
        <li>Set the bpm/offset to be used as a guide when setting notes</li>
        <li>When hovering over a time, press 1, 2, 3 key to set a note</li>
        <li>Click, Click and drag to select notes.</li>
        <li><strong>Right click a note to turn it into a long note</strong></li>
        <li>Type in the title and click export to download as a file. (Include song title to keep track!)</li>
        <li>Use import input field and Import button to load a previously downloaded file</li>
    </ul>
</div>

<style>
    li {
        font-size: larger;
        margin: 0.5rem;
    }

    li::before {
        content: "";
        margin: 0.5rem;
        width: 0.5rem;
        height: 0.5rem;
        background-color: var(--orange);
        display: inline-block;
        border-radius: 50%;
        transform: translate(0, 50%);
    }
    .root {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
    button,
    input {
        padding: 0.5rem;
        border: 1px solid var(--border);
        margin: 0.25rem;
    }

    input {
        background-color: var(--bg2);
    }

    label {
        display: flex;
        align-items: center;
    }

    .ver {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        align-items: flex-start;
    }

    .hor {
        display: flex;
        flex-direction: row;
        gap: 2.5rem;
        margin-bottom: 2rem;
    }
</style>
