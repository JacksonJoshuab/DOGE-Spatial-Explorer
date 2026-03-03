'''
# Contributing to DOGE Spatial Explorer

First off, thank you for considering contributing to DOGE Spatial Explorer! It's people like you that make open source such a great community.

## Where do I go from here?

If you've noticed a bug or have a feature request, [make one](https://github.com/JacksonJoshuab/DOGE-Spatial-Explorer/issues/new)! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

### Fork & create a branch

If this is something you think you can fix, then [fork the repository](https://github.com/JacksonJoshuab/DOGE-Spatial-Explorer/fork) and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```bash
feat/325-add-gaussian-splat-support
```

### Get the test suite running

Make sure you're able to run the tests and they are all passing. This project uses multiple test runners for different components:

- **Cloud Backend**: `npm test` in the `cloud-backend` directory.
- **visionOS/Companion Apps**: Use the Test navigator in Xcode.
- **Blender Addon**: Run the included test suite from within Blender.

### Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first :)

### Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with the latest upstream version of master.

```bash
git remote add upstream git@github.com:JacksonJoshuab/DOGE-Spatial-Explorer.git
git checkout master
git pull upstream master
```

Then update your feature branch from your local copy of master, and push it!

```bash
git checkout 325-add-gaussian-splat-support
git rebase master
git push --force-with-lease origin 325-add-gaussian-splat-support
```

Finally, go to GitHub and [make a Pull Request](https://github.com/JacksonJoshuab/DOGE-Spatial-Explorer/compare) :D

### Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

To learn more about rebasing and merging, check out this guide on [merging vs. rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing).

## How to report a bug

When you file an issue, make sure to answer these five questions:

1. What version of DOGE Spatial Explorer are you using?
2. What operating system and processor architecture are you using?
3. What did you do?
4. What did you expect to see?
5. What did you see instead?

## How to suggest a feature or enhancement

If you find yourself wishing for a feature that doesn't exist in DOGE Spatial Explorer, you are probably not alone. There are bound to be others out there with similar needs. Open an issue on our issues list on GitHub which describes the feature you would like to see, why you need it, and how it should work.
'''
