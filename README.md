# H4 Docker Mongo run command

```
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongodb/mongodb-community-server:latest
```
# H4 Mongo Connection String

`mongodb://localhost:27017`
