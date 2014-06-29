#
# Cookbook Name:: runnable_krain
# Recipe:: default
#
# Copyright 2014, Runnable.com
#
# All rights reserved - Do Not Redistribute
#

include_recipe 'runnable_krain::dependencies'
include_recipe 'runnable_krain::deploy_ssh'
include_recipe 'runnable_krain::deploy'