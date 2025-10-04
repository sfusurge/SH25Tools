<script lang="ts">
    import { getGameStats, getSiteStats } from "$lib/components/firebase/api";
    import { fly } from "svelte/transition";


</script>

{#snippet Block(title: string, data: () => Promise<Record<string, any>>)}
    <div class="block">
        <h1>{title}</h1>

        {#await data()}
            <p>Loading...</p>
        {:then value}
            <div transition:fly={{ x: -25, duration: 250 }}>
                {#each Object.entries(value) as [key, val]}
                    <h2>{key}</h2>
                    {#each Object.entries(val) as [_key, _val]}
                        <div>
                            <span class="header">{_key}: </span>
                            <span class="number">{_val}</span>
                        </div>
                    {/each}
                {/each}
            </div>
        {/await}
    </div>
{/snippet}

{@render Block("Game Stats", getGameStats)}
{@render Block("Site Stats", getSiteStats)}

<style>
    .header {
        color: var(--header);
        display: inline-block;
        width: 150px;
    }

    .block {
        margin-bottom: 4rem;
    }
</style>
