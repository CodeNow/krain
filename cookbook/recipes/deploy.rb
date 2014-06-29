#
# Cookbook Name:: runnable_krain
# Recipe:: deploy
#
# Copyright 2014, Runnable.com
#
# All rights reserved - Do Not Redistribute
#

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
  notifies :create, 'file[config]', :immediately
  notifies :create, 'template[/etc/init/krain.conf]', :immediately
end

file 'config' do
  path "#{node['runnable_krain']['deploy_path']}/current/configs/#{node.chef_environment}.json"
  content JSON.pretty_generate node['runnable_krain']['config']
  action :nothing
  notifies :run, 'execute[npm install]', :immediately
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
