function start_project(){
    document.getElementById("startup-screen").style.display="flex";
    document.querySelector(".ai-panel").style.display="none";
    document.getElementById("tables-screen").style.display="none";
    document.getElementById("processing-screen").style.display="none";
}

function start_analysis(){
    document.getElementById("startup-screen").style.display="none";
    document.querySelector(".ai-panel").style.display="block";
    document.querySelector(".ai-panel").style.overflowY="scroll";
    document.getElementById("processing-screen").style.display="none";
    document.getElementById("tables-screen").style.display="flex";
}

function start_processing(){
    document.getElementById("startup-screen").style.display="none";
    document.getElementById("processing-screen").style.display="flex";
    document.querySelector(".ai-panel").style.display="block";
    document.querySelector(".ai-panel").style.overflowY="scroll";
    document.getElementById("tables-screen").style.display="none";
}

function display_table(){
    document.getElementById("startup-screen").style.display="none";
    document.getElementById("processing-screen").style.display="none";
    document.querySelector(".ai-panel").style.display="block";
    document.querySelector(".ai-panel").style.overflowY="scroll";
    document.getElementById("tables-screen").style.display="flex";
}