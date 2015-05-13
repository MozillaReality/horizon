#!/bin/bash
# Deploys to github pages.

git checkout -b deploy
PRODUCTION=1 gulp build
gulp addon
rm .gitignore
git add dist
git commit -m "Deployed to Github Pages"
git push origin :gh-pages
git subtree push --prefix dist origin gh-pages
git checkout master
git reset --hard HEAD
git branch -D deploy
