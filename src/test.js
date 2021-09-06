apiServ.endpoint("SERVICE_URL_GET_REPO").responseSchema("RepoInfoSpec").get();

apiServ
  .endpoint("SERVICE_URL_CREATE_REPO")
  .responseSchema("RepoInfoSpec")
  .post(data)
  .requestSchema("CreateRepoSpec");

apiServ
  .handleGET("/dashboards/ceo")
  .responseSchema("DashboardSpec")
  .handle(() => {});

apiServ
  .handlePOST("/processes/complaint/complain")
  .requestSchema("ComplaintSpec")
  .responseSchema("GoodResponse")
  .handle((body) => {});
