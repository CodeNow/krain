#
# Cookbook Name:: runnable_krain
# Recipe:: dependencies
#
# Copyright 2014, Runnable.com
#
# All rights reserved - Do Not Redistribute
#

package 'git'

node.set['runnable_nodejs']['version'] = '0.10.26'
include_recipe 'runnable_nodejs'