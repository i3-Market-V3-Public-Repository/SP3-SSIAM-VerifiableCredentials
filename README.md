### Usage

Run the following command in the project root. The first time it will take a while (be patience), since it has to build images and download all the npn dependencies.

```console
./docker-dev-start
```

The OAS documentation can be accessed on [http://localhost:4000/api-spec/ui](http://localhost:4000/api-spec/ui).

You can stop the container at any time with `Ctrl-C`.

If you want to delete and prune all the created images, containers, networks, volumes, just run

```console
./docker-dev-prune
```

### TODO

1.  API authentication
2.  Verify and revoke verifiable credential
3.  Verifiable presentation management