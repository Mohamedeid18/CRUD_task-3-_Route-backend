const http = require("node:http");
const fs = require("node:fs");
const USER_FILE = './users.json';
const PORT = 8080;
//check file is exists or not create
if (!fs.existsSync(USER_FILE)) {
    fs.writeFileSync(USER_FILE, '[]', 'utf8');
}
//read data from file
const getData =  async() => {
    const data = await new Promise((resolve, reject) => {
        fs.readFile(USER_FILE, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
    return JSON.parse(data);
};
//write data to file
const saveData = async (data) => {
    await new Promise((resolve, reject) => {
        fs.writeFile(USER_FILE, JSON.stringify(data), 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};
//send response
const sendRes = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify( data ));
};
//receive request body
const getBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                const data = JSON.parse(body);
                resolve(data);
            } catch (err) {
                reject(err);
            }
        });
    });
};


const server = http.createServer((req, res) => {
    const { method, url } = req;
     if(method === 'POST' && url === '/user') {
        // Handle POST request for users
        getBody(req).then(async (userData) => {
            const { name, age, email } = userData;
            if (!name || !age || !email) {
                sendRes(res, 400, { error: 'Missing required fields' });
                return;
            }
            const users = await getData();
            if(users.find(u => u.email === email)) {
                sendRes(res, 400, { error: 'User with this email already exists' });
                return;
            }
            const newUser = { id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1, ...userData };
            users.push(newUser);
            await saveData(users);
            sendRes(res, 201, {'message': 'User created successfully', 'user': newUser});
        }).catch((err) => {
            sendRes(res, 400, { error: 'Invalid JSON data' });
        });

    }else if (method === 'GET' && url === '/user') {
        // Handle GET request for all users
        getData().then((users) => {
            sendRes(res, 200, users);
        });
    }else if (method === 'GET' && url.startsWith('/user/')) {
        // Handle GET request for a specific user
        const userId = parseInt(url.split('/')[2]);
        getData().then((users) => {
            const user = users.find(u => u.id === userId);
            if (!user) {
                sendRes(res, 404, { error: 'User not found' });
                return;
            }
            sendRes(res, 200, user);
        });
    }else if (method === 'PUT' && url.startsWith('/user/')) {
        // Handle PUT request for a specific user
        const userId = parseInt(url.split('/')[2]);
        getBody(req).then(async (userData) => {
            const users = await getData();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                sendRes(res, 404, { error: 'User not found' });
                return;
            }
            if ( userData.email !== users[userIndex].email) {
                if (users.some(u => u.id !== userId && u.email === userData.email)) {
                    sendRes(res, 400, { error: 'User with this email already exists' });
                    return;
                }
            }

            users[userIndex] = { ...users[userIndex], ...userData };
            await saveData(users);
            sendRes(res, 200, { message: 'User updated successfully', user: users[userIndex] });
        }).catch((err) => {
            sendRes(res, 400, { error: 'Invalid JSON data' });
        });
    }else if (method === 'DELETE' && url.startsWith('/user/')) {
        // Handle DELETE request for a specific user
        const userId = parseInt(url.split('/')[2]);
        getData().then(async (users) => {
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                sendRes(res, 404, { error: 'User not found' });
                return;
            }
            users.splice(userIndex, 1);
            await saveData(users);
            sendRes(res, 200, { message: 'User deleted successfully' });
        });
    } else {
        sendRes(res, 404, { error: 'Route not found' });
    }
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

