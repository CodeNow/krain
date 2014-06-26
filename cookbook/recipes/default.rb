#
# Cookbook Name:: runnable_krain
# Recipe:: default
#
# Copyright 2014, Runnable.com
#
# All rights reserved - Do Not Redistribute
#

package 'git'

node.set['runnable_nodejs']['version'] = '0.10.26'
include_recipe 'runnable_nodejs'

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
  notifies :run, 'execute[npm install]', :immediately
  notifies :create, 'template[/etc/init/krain.conf]', :immediately
end

execute 'npm install' do
  cwd "#{node['runnable_krain']['deploy_path']}/current"
  action :nothing
  notifies :restart, 'service[krain]', :delayed
end

template '/etc/init/krain.conf' do
  source 'krain.conf.erb'
  variables({
    :name 		=> 'krain',
    :deploy_path 	=> "#{node['runnable_krain']['deploy_path']}/current",
    :log_file		=> '/var/log/krain.log',
    :node_env 		=> node.chef_environment
  })
  action :create
  notifies :restart, 'service[krain]', :immediately
end

service 'krain' do
  provider Chef::Provider::Service::Upstart
  action [:start, :enable]
end
