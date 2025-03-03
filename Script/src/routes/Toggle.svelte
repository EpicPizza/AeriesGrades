<script>
    let open = false;

    function toggle() {
        open = !open;
    }
</script>

<slot open={open} toggle={toggle}></slot>