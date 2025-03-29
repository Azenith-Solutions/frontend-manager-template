import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () =>{
        const wantsToLogout = window.confirm("Você realmente deseja sair?");
        if(wantsToLogout){
            localStorage.removeItem('isLoggedIn');
            navigate('/');
        }
    }

    return(
        <>
            <h1 class="text-3xl font-bold underline">
                Hello world!
            </h1>
            <button onClick={handleLogout}>Logout</button>
        </>
    )
}

export default Dashboard;