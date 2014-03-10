require 'webrick'
task :server do
  s = WEBrick::HTTPServer.new Port: 3000, DocumentRoot: 'public'
  trap('INT') { s.shutdown }
  s.start
end
