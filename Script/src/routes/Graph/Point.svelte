<script>
    export let x;
    export let y;
    export let mode;
</script>

<g>
    <circle cx={x} cy={y} class="{mode == 'dark' ? 'fill-blue-400' : mode == 'light' ? 'fill-blue-700' : 'fill-blue-700 dark:fill-blue-400'}" r="5" />
</g>
