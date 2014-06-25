#
# Cookbook Name:: runnable_api-server
# Recipe:: default
#
# Copyright 2014, Runnable.com
#
# All rights reserved - Do Not Redistribute
#

node.set['runnable_nodejs']['version'] = '0.10.26'
include_recipe 'runnable_nodejs'

file '/tmp/git_sshwrapper.sh' do
  content "#!/usr/bin/env bash\n/usr/bin/env ssh -o 'StrictHostKeyChecking=no' -i '/root/.ssh/runnable_krain' $1 $2\n"
  owner 'root'
  group 'root'
  mode 0755
  action :create
end

cookbook_file '/root/.ssh/runnable_krain-id_rsa' do
  source 'runnable_krain-id_rsa'
  owner 'root'
  group 'root'
  mode 0600
  action :create
  notifies :deploy, "deploy[#{node['runnable_krain']['deploy_path']}]", :delayed
  notifies :create, 'cookbook_file[/root/.ssh/runnable_krain.pub]', :immediately
end

cookbook_file '/root/.ssh/runnable_krain-id_rsa.pub' do
  source "#{runnable_krain-id_rsa.pub'
  owner 'root'
  group 'root'
  mode 0600
  action :create
  notifies :deploy, "deploy[#{node['runnable_krain']['deploy_path']}]", :delayed
end

deploy node['runnable_krain']['deploy_path'] do
  repo 'git@github.com:CodeNow/krain.git'
  git_ssh_wrapper '/tmp/git_sshwrapper.sh'
  branch 'master'
  deploy_to node['runnable_krain']['deploy_path']
  migrate false
  create_dirs_before_symlink []
  purge_before_symlink []
  symlink_before_migrate({})
  symlinks({})
  action :deploy
end
