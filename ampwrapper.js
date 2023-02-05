//not actually a wrapper but couldn't find a name more fit for this
const axios = require('axios').default;
const source = axios.CancelToken.source();
const {FileLogger, projectName} = require('./utils.js')
const timeout = setTimeout(() => {
    source.cancel();
    // Timeout Logic
}, 15 * 1000);
const username = process.env.AMP_USER;

/**
* @todo Finish updating code with FileLogger custom file logging builder
*/

async function login(API){
    let sessionId = await axios.post(API + "/Core/Login", {
        username: process.env.AMP_USER,
        password: process.env.AMP_PASSWORD,
        token: "",
        rememberMe: false,
        cancelToken: source.token
    }, { headers: { Accept: "text/javascript" } })
    if (!sessionId.data.success) {
        console.error(`Get instance failed for ${username} in ampWrapper.js\nsessionID failed`)
            //log failed login to file
        FileLogger("latest", "fatal", `Get instance failed for ${username} in ampWrapper.js\nsessionID failed`)
        FileLogger("API", "fatal", `Get instance for ${username} in ampWrapper.js\nsessionID failed`)
        clearTimeout(timeout);
        return;
    }
    clearTimeout(timeout);
    return sessionId.data.sessionID
}

//gets the instance GUID out of the instance name
async function getInstances() {
    try {
        sessionId = await login()
        let response = await axios.post(API + "/ADSModule/GetInstances", { SESSIONID: sessionId })
        let Instance = response.data.result[0].AvailableInstances
        return Instance
    } catch (error) {
        //log error to file
        FileLogger("latest", "fatal", `Error getting instance in ampWrapper.js \n STACK TRACE \n ${error}`)
        FileLogger("API", "fatal", `Error getting instance in ampWrapper.js \n STACK TRACE \n ${error}`)
        console.log(`Error getting instance in ampWrapper.js \n STACK TRACE \n ${error}`);
    }
}

// AMP Instance interaction function
async function sendToInstance(GUID, messages, API) {
    
    // Attempt authorization to AMP panel
    try {
        sessionId = await axios.post(API + "/Core/Login", {
            username: process.env.AMP_USER,
            password: process.env.AMP_PASSWORD,
            token: "",
            rememberMe: false,
            cancelToken: source.token
        }, { Accept: "text/javascript" })

        // Checking for successfull AMP auth before moving on to AMP Instance auth
        if (sessionId.data.success) {
            clearTimeout(timeout);
            let instanceSessionId = await axios.post(API + `/ADSModule/Servers/${GUID}/API/Core/Login`, {
                username: process.env.AMP_USER,
                password: process.env.AMP_PASSWORD,
                token: "",
                rememberMe: false,
                cancelToken: source.token
            }, { Accept: "text/javascript", SESSIONID: sessionId })

            if (!instanceSessionId.data.success) {
                clearTimeout(timeout);
                //log to file
                FileLogger("latest", "fatal", `AMP server Instance Login failed for ${username} in ampWrapper.js\nInstance SessionID failed`)
                FileLogger("API", "fatal", `AMP server Instance Login failed for ${username} in ampWrapper.js\nInstance SessionID failed`)
                console.log(`AMP server Instance Login failed for ${username} in ampWrapper.js\nInstance SessionID failed`)
                return;
            }

            instanceSessionId = instanceSessionId.data.sessionID
            //check if messages is an array, if it is an array then for each message in the array we will await axios.post(API + `/ADSModule/Servers/${GUID}/API/ADSModule/SendConsoleMessage`, { message: message, SESSIONID: instanceSessionId, cancelToken: source.token }) and export the axios post as a variable so we can return it as response.data.result
            if (Array.isArray(messages)) {
                clearTimeout(timeout);
                console.log(`Sending commands to AMP server`);
                let response = messages.map(async message => await axios.post(API + `/ADSModule/Servers/${GUID}/API/Core/SendConsoleMessage`, { message: message, SESSIONID: instanceSessionId, cancelToken: source.token }))
                return response
            } else {
                clearTimeout(timeout);
                console.log(`Sending command to AMP server`);
                //if messages is not an array then we will just await axios.post(API + `/ADSModule/Servers/${GUID}/API/ADSModule/SendConsoleMessage`, { message: message, SESSIONID: instanceSessionId, cancelToken: source.token }) and export the axios post as a variable so we can return it as response.data.result
                let response = await axios.post(API + `/ADSModule/Servers/${GUID}/API/Core/SendConsoleMessage`, { message: messages, SESSIONID: instanceSessionId, cancelToken: source.token })
                return response
            }            
            
        } else {
            clearTimeout(timeout);
            //log AMP auth fail
            FileLogger("latest","fatal", `Sending to AMP server instance failed for ${username} in ampWrapper.js`)
            FileLogger("API","fatal", `Sending to AMP server instance failed failed for ${username} in ampWrapper.js`)
            console.error(`Sending to AMP server instance failed for ${username} in ampWrapper.js`)
            return;
        }
    } catch (error) {
        //log error to file
        FileLogger("latest", "fatal", `Error in ampWrapper.js \n STACK TRACE \n${error}`)
        console.log(`Error in ampWrapper.js \n${error}`);
    }
}

module.exports = {
    getInstances,
    sendToInstance
}