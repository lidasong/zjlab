# zjlab

> zjlab cli is based on @vue/cli and @vue/cli-service

The Cli `zjlab` is created for zhejianglab fellowers to quickly develop our customized project.
and zjlab cli is just one cli, do all things, includes create/lint/develop/build/analyze and ...

## What Zjlab Cli Do

* init project

  From now on, zjlab can init multiple projects for different applications.Includes mobile H5 application,backend website application,saber application for IOC and vue default applications.

* front-end project specification

  With the cli we can simplify almost all specification works.
  Includes directory structure,develop,lint,commit,build and so on.

## How To Use

Zjlab cli is very easy to use. For developer, just install the zjlab in global environment by `npm i zjlab -g`. And then you can just put `zjlab -h` in the command line tool.That will show you how to use.
For example, you want init a project named by `work`.

Just put `zjlab create work`,then you can choose what type project you want, includes saber, backend, h5, default.

After you choose the type, the cli will pull the whole initial project into your working directory and pull the dependencies by auto.
Lastly, just put `yarn start` to start your project. What a easy way!

## Besides

Except these, the cli integrate the eslint and commit hooks.
When we develop the project, the supported IDE can help us to check and lint our code.
Also, when we commit our code to git or gitlab, the hooks will work to check the code and the commit info. With this, the specification will work autoly.
