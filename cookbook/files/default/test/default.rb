require 'minitest/spec'

describe_recipe 'runnable_krain::default' do

  include MiniTest::Chef::Assertions
  include Minitest::Chef::Context
  include Minitest::Chef::Resources
  include Chef::Mixin::ShellOut

  it 'installs nodejs v0.10.26' do
    node_version = shell_out('node --version')
    assert_equal("v0.10.26\n", node_version.stdout, "Incorrect node version present: #{node_version.stdout}")
  end

  it 'creates github ssh deploy key files' do
    file('/root/.ssh/runnable_krain-id_rsa').must_exist.with(:owner, 'root').and(:group, 'root').and(:mode, 0600)
    file('/root/.ssh/runnable_krain-id_rsa.pub').must_exist.with(:owner, 'root').and(:group, 'root').and(:mode, 0600)
  end

  it 'deploys the application' do
    link("#{node['runnable_krain']['deploy_path']}/current").must_exist.with(:link_type, :symbolic)
  end

  it 'listens on port 3000' do
    assert shell_out('lsof -n -i :3000').exitstatus == 0
  end

end

