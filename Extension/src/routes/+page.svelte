<script lang="ts">
    let value = '';
    let result = '';

    function select(this: HTMLInputElement, event: Event) { this.select() }
</script>

<div class="container">
    <h1>Calculator</h1>
    <form on:submit|preventDefault>
      <input type="text" placeholder="1 + 2" bind:value={value} on:click={select} />
    </form>

    <p>{result}</p>
</div>