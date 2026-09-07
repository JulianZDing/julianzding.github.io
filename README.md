# julianzding.github.io

Source code for Julian Ding's personal website :)

## Local testing

This website uses [Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll) to render common elements like the page headers.

To run Jekyll locally, first install [Ruby](https://www.ruby-lang.org/en/documentation/installation/), then add the following `Gemfile` to the root directory of the repository:

```gemfile
source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins
```

A local server can then be spun up via

```shell
bundle install
bundle exec jekyll serve
```

Changes to the source files are automatically reflected on the server.
