#
# Cookbook Name:: runnable_krain
# Recipe:: deploy_ssh
#
# Copyright 2014, Runnable.com
#
# All rights reserved - Do Not Redistribute
#

file '/tmp/git_sshwrapper.sh' do
  content "#!/usr/bin/env bash\n/usr/bin/env ssh -o 'StrictHostKeyChecking=no' -i '/root/.ssh/runnable_krain-id_rsa' $1 $2\n"
  owner 'root'
  group 'root'
  mode 0755
  action :create
end

directory '/root/.ssh' do
  owner 'root'
  group 'root'
  mode 0700
  action :create
  notifies :create, 'cookbook_file[/root/.ssh/runnable_krain-id_rsa]', :immediately
  notifies :create, 'cookbook_file[/root/.ssh/runnable_krain-id_rsa.pub]', :immediately
end

cookbook_file '/root/.ssh/runnable_krain-id_rsa' do
  source 'runnable_krain-id_rsa'
  owner 'root'
  group 'root'
  mode 0600
  action :create
  notifies :deploy, "deploy[#{node['runnable_krain']['deploy_path']}]", :delayed
  notifies :create, 'cookbook_file[/root/.ssh/runnable_krain-id_rsa.pub]', :immediately
end

cookbook_file '/root/.ssh/runnable_krain-id_rsa.pub' do
  source 'runnable_krain-id_rsa.pub'
  owner 'root'
  group 'root'
  mode 0600
  action :create
  notifies :deploy, "deploy[#{node['runnable_krain']['deploy_path']}]", :delayed
end