An improved interface for viewing your grades on Aeries! See all your assignments organized, predict your grades, and adjust/add categories and assignments.

## Commands

1. Install node v22: https://nodejs.org/en
2. Install package manager using npm (installed with node): npm install -g pnpm

All commands are run from the root of the project, from a terminal: To run, first install dependencies, then build extension.

| Command                   | Action                                                 |
| :------------------------ | :------------------------------------------------------|
| `pnpm install`            | Installs dependencies                                  |
| `pnpm run devext`         | Builds extension in Extension folder                   |

There is no seperate dev/prod command, extension must be built to be tested.

## Versions

- 0.1.0: Intial version of extension
- 0.1.1: Updated permissions so it only asks for aeries.net and not web history
- 0.2.0: Changed weighted/actual score behavior, now only actual score is shown with multiplier
- 0.2.1: Bug fix, multiplier on wrong z index
- 0.2.2: Bug fix, missing assignments without missing keyword were identified as ungraded
- 0.2.3: Bug fix, misspelled variable

## Testing

Here is how to test the extension:

1. Go to aeries demo website: https://demo.aeries.net/AeriesTX/Login.aspx
2. Click on the student link under the sign in button.
3. Go through the sign in page, then you will be redirected to Aeries Student dashboard page.
4. Click on Go to Aeries Grades+ button to go to the grade viewer.

## How it works

Once this extension is installed, it will add content scripts to a page for all the applicable pages that the extension runs on (Dashboard, Gradebook, GradebookDetails). Then the content script will inject the html and js bundled from the svelte app in the Script folder. It'll also do smaller tasks such as hiding the original page and making sure styling from my extension doesn't significantly break other things. The tailwindcss file is a css framework used for styling. After all of this, it is the bundled svelte app's job now to do all the scrapping of data and interface.

## Why a monorepo?

Originally, I tended to this to be two seperate svelte apps combined into one extension. One that runs as a popup and one that gets injected into the aeries webpage. However, I realized that the popup svelte app wouldn't be necessary for release, so I kept the project as is with this svelte app deleted.

## More about Script

I made this extension in svelte so I can quickly develop the interface. It comes with its own disadvantages, as svelte apps weren't necessarily designed to run within other pages. So, I used a package that bundles the svelte app into one file. Then, insert.js will take the necessary js and html and place into the content script of the extension. Some limitations of the svelte app is that functions and stores such as $page and onMount are not available in this environment, as such, I added a start function which is started by the content script by clicking a hidden button.
