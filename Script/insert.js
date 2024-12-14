//@ts-expect-error
import fs from 'node:fs';

fs.readFile('./output.html', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  const final = "<div id=\"aeriesgrades+main\" class=\"w-full h-full\">" + data.substring(data.indexOf("<body>") + 6, data.indexOf("</body>")) + "</div>";

  fs.readFile('../Extension/script.js', 'utf8', (err, code) => {
    if (err) {
      console.error(err);
      return;
    }
  
    code = code.substring(code.indexOf("//--") + 4); 

    code = "//final\n\nconst final = '" + final.replace(data.substring(data.indexOf("<script>"), data.indexOf("</script>") + 9), "").replaceAll("\n", "\\n") + "';\n\n//--" + code;

    code = code.replace(code.substring(code.indexOf("//final hydration"), code.lastIndexOf("//--") + 4), "//final hydration\n\n" + "---" + "\n\n//--");

    code = code.substring(0, code.indexOf("---")) + data.substring(data.indexOf("<script>") + 8, data.indexOf("</script>")) + code.substring(code.indexOf("---") + 3);

    fs.writeFile('../Extension/script.js', code, (err) => {
      if (err) {
        console.error(err);
      } else {
        // file written successfully
      }
    });
  });
});