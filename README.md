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

0.1.0: Intial version of extension.

0.1.1: Updated permissions so it only asks for aeries.net and not web history.

0.2.0: Changed weighted/actual score behavior, now only actual score is shown with multiplier.

0.2.1: Bug fix, multiplier on wrong z index.

0.2.2: Bug fix, missing assignments without missing keyword were identified as ungraded.

0.2.3: Bug fix, misspelled variable.

0.3.0: 
- Added new settings menu which includes options for appearance, developer mode, marking zeros as missing, and final calculation keywords.
- Apperance can now be changed between light, dark, and system in settings menu.
- Enabling developer mode for now just reveals a hide extension button.
- Marking zeros as missing (some teachers may give a zero instead of properly marking an assignment as missing).
- Final calculation detects if certain keywords are in the category name and displays a calculation of how many points or percent you need to get a certain grade (default 90).
- Added simplified period name, grade, and buttons bar that sticks to the top.
- Added error popup for when expected grade and actual grade do not match.
- When refreshing page, extension stores in url what class was loaded instead of just kicking you back to the main page.
- Adjusted background colors.

0.3.1:
- Chrome Web Store roll back (accidently submitted extension without parts of the code...)

0.3.2:
- Fixed extension submission.

0.3.3:
- Completed fake final feature to test how many points you need if there were no assignments before hand.
- Fixed bug where final calculation did not take into account fake assignments.

0.3.4:
- Fixed bug where error popup would show if you edited category weight.
- Disabled settings temporally because of bugs causing it not to save properly.

0.4.0:
- Added new grade history graph.
- Fixed settings bug and is now able to save again.
- Fixed bug where category would should 0% on non-edit mode if the only assignments in it were fake.

0.4.1:
- Fixed grade history graph overflow.
- Status and comments are now recognized.

0.4.2:
- Main gradebook page now uses proper links for better UX.
- Developer mode feature added that allows data to be downloaded and uploaded for testing.
- Hidden elements added with stringified data to allow for scraping by other applications.

0.4.3:
- Classes with unweighted categories are now supported.

0.4.4:
- Slightly tweaked interface for classes with unweighted categories.

0.5.0:
- Aeries Grades+ now shows current terms on main page.
- Bug with unweighted categories, calculates NaN with 0 points.

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
