<script lang="ts">
    // Code
</script>

<h1>Stormhacks 25 Tools!</h1>

<div class="box">
    <a href="/beatmapper"><button class="bigBtn"> 🎵 BeatMapper </button></a>
    <a href="stats"><button class="bigBtn">📈 Usage Tracking </button></a>
    <a href="maze"><button class="bigBtn">🌽 Maze</button></a>
</div>

<style>
    .bigBtn {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2rem;

        border: 2px solid var(--border);
        background-color: var(--bg2);

        font-size: x-large;
        transition: scale 300ms ease-out;
    }

    .bigBtn:hover {
        scale: 1.1;
    }

    .box {
        display: flex;
        flex-direction: row;
        gap: 1rem;

        max-width: 100%;
        flex-flow: wrap;
    }
</style>
