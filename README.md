# i3-Market Verifiable Credential Service

The service for issuing, verifying and revoking W3C Verifiable Credential in i3-Market. 
You can find the detailed documentation [here](https://i3-market.gitlab.io/code/backplane/backplane-api-gateway/backplane-api-specification/systems/trust-security-privacy/ssi-iam/user-centric-authentication.html#troubleshooting).

## Installation

Clone the repository with

```console 
$ git clone git@gitlab.com:i3-market/code/wp3/t3.1-self-sovereign-identity-and-access-management/verifiable-credentials.git
$ cd verifiable-credentials
```

## Local development

```console 
$ cd verifiable-credentials/app
$ npm i
$ npm start
```

You should update the configuration file `app/src/config.ts` before running the service. Specifically, it is necessary to fill the default environment variables. 


## Local development using docker

Run the following command in the project root. The first time it will take a while (be patience), since it has to build images and download all the npn dependencies.

```console
./docker-dev-start
```

The OAS documentation can be accessed on [http://localhost:4200/release2/vc/api-spec/ui](http://localhost:4200/release2/vc/api-spec/ui).

You can stop the container at any time with `Ctrl-C`.

If you want to delete and prune all the created images, containers, networks, volumes, just run

```console
./docker-dev-prune
```

Since the `app` directory is shared with the docker container with mapped user permissions, you can just edit any files in the `app` directory locally. The container will be running `ts-node` and `nodemon` to directly execute the source code and refresh the server if any file has changed. You can also attach any debugger in your local machine to the container, which will be listening at default port 9229.

#### Development scripts

Since `npm` and `node` are likely to be needed, if your OS allows you to execute shell scripts, you can just also use the `npm` and `node` scripts provided for convenience.

```console
$ ./npm -v
6.14.8
$ ./node -v
v14.15.1
```

## Production

You can build the production docker image using the helpers provided in this repository:

```console
# Build the image to work locally
./docker-prod-build

# Build and push the image into the gitlab registry
./docker-prod-push
```

The script `docker-prod` manages the deployment. You can use it to extract the files required in the production environment. To do so execute the following commands:

### Configuration

Create a `.env.vc` file and configure the server using the environmental variables defined in (template.env)[./template.env].

> WARNING: Paths should be relative to the `app` directory

## Server deployment

To deploy this service in a server it is just necessary to copy the `docker-compose.yaml` and `vc.env` files in a server directory and run the following command:

```console
$ docker-compose up
```

The service images will be downloaded directly from the i3-Market Gitlab image registry.
You need to have a valid Gitlab access.