const fs = require('node:fs');

fs.readFile('./Extension/script.js', 'utf8', (err, code) => {
  if (err) {
    console.error(err);
    return;
  }

  code = code.substring(code.indexOf("//--") + 4); 

  code = "//final\n\n\n\n//--" + code;

  code = code.replace(code.substring(code.indexOf("//final hydration"), code.lastIndexOf("//--") + 4), "//final hydration\n\n" + "---" + "\n\n//--");

  code = code.substring(0, code.indexOf("---")) + "" + code.substring(code.indexOf("---") + 3);

  fs.writeFile('./Extension/script.js', code, (err) => {
    if (err) {
      console.error(err);
    } else {
      // file written successfully
    }
  });
});