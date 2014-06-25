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

  it 'listens on port 3000' do
    assert shell_out('lsof -n -i :3000').exitstatus == 0
  end

end

