name             'runnable_krain'
maintainer       'Runnable.com'
maintainer_email 'ben@runnable.com'
license          'All rights reserved'
description      'Runnable.com krain cookbook'
long_description IO.read(File.join(File.dirname(__FILE__), 'README.md'))
version          '0.1.1'

supports 'ubuntu'

depends 'runnable_nodejs'

recipe "runnable_krain::default", "Installs and configures krain"
