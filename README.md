# Install Minikube on Linux

To install minikube on a Linux system you can install below binary

```sh
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64
```

If you face any problem in installation process checkout below link
[minikube installation](https://minikube.sigs.k8s.io/docs/start/?arch=%2Flinux%2Fx86-64%2Fstable%2Fbinary+download)

# Start Minikube

every version of minikube has some pros and cons in it. using --container-runtime as docker we are facing problem while scraping monitoring data using prometheus and grafana that's why we are using containerd with a older version of kubernetes. Also I have allocated more memory and CPU and disk space to my minikube because minikube got stuck if it doesn't have enough resources to spawn my pods.
I was facing the below issue while setting up prometheus in my minikube setup
[Prometheus_issue](https://github.com/prometheus-community/helm-charts/issues/3614)

```sh
minikube start \
    --nodes 3 \
    --cpus 4 \
    --memory 6GB \
    --disk-size 50GB \
    --container-runtime=containerd \
    --kubernetes-version=v1.28.3 \
    --bootstrapper=kubeadm \
    --extra-config=kubelet.authentication-token-webhook=true \
    --extra-config=kubelet.authorization-mode=Webhook \
    --extra-config=scheduler.bind-address=0.0.0.0 \
    --extra-config=controller-manager.bind-address=0.0.0.0
```

Aditionally start minikube tunnel {minikube tunnel runs as a process, creating a network route on the host to the service CIDR of the cluster using the cluster's IP address as a gateway. The tunnel command exposes the external IP directly to any program running on the host operating system} to allow our nginx ingress controller external IP to work.
Also to work with kubernetes resources we have to install kubectl if you don't installed it yet in your machine.

```sh
minikube tunnel
```

# Create a React frontend docker image

write a dockerfile to build your frontend docker image. Inside docker file we need to do a npm build of our and and additionally we need nginx to serve the frontend app. Inside our dockerfile it self we are setting up the backend hostname if you don't specify any backend hostname it will by default work on localhost:5000.

```sh
cd frontend
docker build -t e-commerce-depl-frontend:<IMAGE_TAG> --build-arg BACKEND_HOSTNAME=<YOUR_BACKEND_HOSTNAME> .
docker tag e-commerce-depl-frontend:<IMAGE_TAG> <YOUR_DOCKERHUB_USERNAME>/e-commerce-depl-frontend:<IMAGE_TAG>
docker push <YOUR_DOCKERHUB_USERNAME>/e-commerce-depl-frontend:<IMAGE_TAG>
```

# Create a node.js backend docker image

Write a dockerfile to build your backend docker image and we simply do a npm build inside dockerfile and run index.js file using node package manager as entrypoint executable.

```sh
cd backend
docker build -t e-commerce-depl-backend:<IMAGE_TAG> .
docker tag e-commerce-depl-backend:<IMAGE_TAG> <YOUR_DOCKERHUB_USERNAME>/e-commerce-depl-backend:<IMAGE_TAG>
docker push <YOUR_DOCKERHUB_USERNAME>/e-commerce-depl-backend:<IMAGE_TAG>
```

# My simple ecommerce server architecture

[add excalidraw image]

# Setup Nginx

Quickest way to setup nginx ingress controller is using helm charts we are using helm chart to deploy nginx in our minikube like below. Note without your minikube tunnel on your nginx controller external IP will stay on pending state.

```sh
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx ingress-nginx/ingress-nginx -n <YOUR_NAMESPACE>
```

you should see output like below
<PUT_IMAGE_HERE>

# Setup MongoDB

To setup our MongoDB we have used bitnami helm chart. Minikube act differently depends on the runtime environment we are using minikube with docker as runtime works file while creating any PVC but it will not work if you user your runtime as containerd. root cause analysis is still pending we use additional variable with helm chart which works in our case

```sh
helm install mongo bitnami/mongodb --set auth.username=<MONGODB_USER>,auth.password=<MONGODB_PASSWORD>,auth.database=<MONGODB_DATABASE>,volumePermissions.enabled=true
```

<PUT_IMAGE_HERE>

# Setup RabbitMQ

```sh
helm install rabbitmq bitnami/rabbitmq --set auth.username=<RABBITMQ_USER>,auth.password=<RABBITMQ_PASSWORD>,volumePermissions.enabled=true
```

<PUT_IMAGE_HERE>

# Create Database credential secret file

We create a secret to store our databases username and password in one place and we will be using this secret in our backend deployment file to access database username and password

```sh
kubectl create secret generic db-queue-cred \
  --from-literal=MONGO_USER=<MONGO_USER> \
  --from-literal=MONGO_PASSWORD=<MONGO_PASSWORD> \
  --from-literal=RABBITMQ_USER=<RABBITMQ_USER> \
  --from-literal=RABBITMQ_PASSWORD=<RABBITMQ_PASSOWRD>
```

# frontend and backend kubernetes manifests

We have created a deployment files for both app using my public dockerHub image you should replace the image with your dockerHub image repo and also set imagePullPolicy as always to pull images whenever a restart happen. Also created ClusterIP service and ingress file to server external request and user nginx as ingress class. Additionally created a HPA.yaml to automatically scale up pods incase of high traffic based on CPU utilization. We mount MongoDB and RabbitMQ credentials variables from the secret that we have created.

```sh
cd kubernetes
kubectl apply -f frontend/
kubectl apply -f backend/
```

you should see results like below
<PUT_IMAGE_HERE>
Note: If you have any problem in any installation process please check pods logs, you can also check logs or describe the deployment/statefulSet and check what is happening.

# Setup Gatekeeper

Gatekeeper is an admission controller that validates requests to create and update Pods on Kubernetes clusters, using the Open Policy Agent (OPA). Using Gatekeeper allows administrators to define policies with a constraint, which is a set of conditions that permit or deny deployment behaviors in Kubernetes.In our case we have setup a constrains which specifies if you do not specify resource limit {cpu usage and memory usage} for a pod Gatekeeper will not allow us to spawn that pod. we have a demo.yaml of a nginx pod you can verify your Gatekeeper using that file.

```sh
cd kubernetes/gatekeeper/
kubectl apply -f gatekeeper.yaml
kubectl apply -f require-resource-limit.yaml
kubectl apply -f resource-limit-contrains.yaml
```

<PUT_IMAGE_HERE>

# Setup Kube-prometheus-stack

We use kube-prometheus-stack official helm chart to deploy our monitoring setup. we have faced problem exporting monitoring data while using minikube with docker as runtime we changed the runtime to containerd by creating new minikube cluster it works fine with latest chart version. To setup ingress for prometheus and grafana we enable the ingress and specify ingressClass as nginx and also specified out host name.

```sh

helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --values kubernetes/prometheus-stack/values.yaml
```
