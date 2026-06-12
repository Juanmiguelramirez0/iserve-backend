const API_URL = "http://localhost:5000/api";

// 1. Login Function
export const loginUser = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    
    if (response.ok) {
        // SAVE the token so the user stays logged in
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
    }
    return data;
};

// 2. Submit Service Request (iServe)
export const submitRequest = async (requestData) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/requests`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Send the token here!
        },
        body: JSON.stringify(requestData)
    });
    return await response.json();
};

// 3. Get My Requests
export const getMyRequests = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/requests/my`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    return await response.json();
};