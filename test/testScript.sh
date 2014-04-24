TEST_ROOT_DIR=$(pwd)
TEST_FOLDER=$(echo "$TEST_ROOT_DIR/test_folder")
TEST_FILE=$(echo "$TEST_ROOT_DIR/test_file")
EMPTY_DIR=$(echo "$TEST_ROOT_DIR/empty_dir")

echo normal dir read
OUT=`curl -s "localhost:3000$TEST_FOLDER/"`
[[ "$OUT" == '[{"name":"testfile2","path":"/Users/anand/run/other/krain/test/test_folder/","isDir":false}]' ]] && echo pass || echo FAIL
echo should redirect
OUT=`curl -s -L "localhost:3000$TEST_FOLDER"`
[[ "$OUT" == '[{"name":"testfile2","path":"/Users/anand/run/other/krain/test/test_folder/","isDir":false}]' ]] && echo pass || echo FAIL

echo normal empty dir read
OUT=`curl -s "localhost:3000$EMPTY_DIR/"`
[[ "$OUT" == '[]' ]] && echo pass || echo FAIL
echo empty dir should redirect
OUT=`curl -s -L "localhost:3000$EMPTY_DIR"` 
[[ "$OUT" == '[]' ]] && echo pass || echo FAIL


echo fake dir read
OUT=`curl -s "localhost:3000$EMPTY_DIR/notexist/"`
[[ "$OUT" == '{"errno":34,"code":"ENOENT","path":"/Users/anand/run/other/krain/test/empty_dir/notexist/"}' ]] && echo pass || echo FAIL

echo file read
OUT=`curl -s "localhost:3000$TEST_FILE"`
[[ "$OUT" == 'this is a test file' ]] && echo pass || echo FAIL

echo non existing file
OUT=`curl -s "localhost:3000$TEST_FILE/doesnotreal"`
[[ "$OUT" == '{"errno":27,"code":"ENOTDIR","path":"/Users/anand/run/other/krain/test/test_file/doesnotreal"}' ]] && echo pass || echo FAIL