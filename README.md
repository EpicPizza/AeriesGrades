An improved interface for viewing your grades on Aeries! See all your assignments organized, predict your grades, and adjust/add categories and assignments.

## How it works

Once this extension is installed, it will add content scripts to a page for all the applicable pages that the extension runs on (Dashboard, Gradebook, GradebookDetails). Then the content script will inject the html and js bundled from the svelte app in the Script folder. It'll also do smaller tasks such as hiding the original page and making sure styling from my extension doesn't significantly break other things. An additional script is injected as a inline script element that pays attention to which element needs to be clicked and does it with aeries functions, since the content script isn't able to do it. The tailwindcss file is a css framework used for styling. After all of this, it is the bundled svelte app's job now to do all the scrapping of data and interface.

## Why a monorepo?

Originally, I tended to this to be two seperate svelte apps combined into one extension. One that runs as a popup and one that gets injected into the aeries webpage. However, I realized that the popup svelte app wouldn't be necessary for release, so I kept the project as is with this svelte app deleted.

## More about Script

I made this extension in svelte so I can quickly develop the interface. It comes with its own disadvantages, as svelte apps weren't necessarily designed to run within other pages. So, I used a package that bundles the svelte app into one file. Then, insert.js will take the necessary js and html and place into the content script of the extension. Some limitations of the svelte app is that functions and stores such as $page and onMount are not available in this environment, as such, I added a start function which is started by the content script by clicking a hidden button.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                                 |
| :------------------------ | :------------------------------------------------------|
| `pnpm install`            | Installs dependencies                                  |
| `pnpm run devext`         | Builds extension in Extension folder                   |

There is no seperate dev/prod command, extension must be built to be tested.
