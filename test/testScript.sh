curl "localhost:3000/listall?path=/1&containerId=/C1" | json_pp
curl "localhost:3000/list?path=/1&containerId=/C1" | json_pp
curl "localhost:3000/read?path=/1/level1file0&containerId=/C1"

rm -rf ./C1/newThing
curl -X POST "localhost:3000/mkdir?path=/newThing&containerId=/C1" | json_pp
curl -X POST "localhost:3000/mkdir?path=/newThing&containerId=/C1" | json_pp
rm -rf ./C1/newThing

curl -X POST "localhost:3000/mkdir?path=/rename_me&containerId=/C1" | json_pp
curl -X POST "localhost:3000/rename?oldpath=/rename_me&newpath=/renamed&containerId=/C1" | json_pp

