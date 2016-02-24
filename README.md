How to run
==========

```
npm install
node create-project.js
```

You have to wait for about 1 minute for complete. If everything is OK and the project is created successfully, the url will be displayed in the last line.

You can just copy and open it in your browser.

If there is anything failed, you will see something like `error`, or `invalid status code` in the output.

Note
====

The server can't affort too many workspaces (for now, it's safe if the amount if less than 4). So you sometimes need to open this workspaces url, and stop and delete unused workspaces before trying:

<http://198.199.105.97:8080/dashboard/#/workspaces>

1. You click on a workspace to see operations
2. You click "Stop" button if it's still running
3. You click "Delete" button to delete it