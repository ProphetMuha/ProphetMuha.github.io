const quizForm = document.getElementById("serverQuiz");
const timerDisplay = document.getElementById("timer");
const resultsPanel = document.getElementById("resultsPanel");
const overallResult = document.getElementById("overallResult");
const totalScore = document.getElementById("totalScore");
const percentageScore = document.getElementById("percentageScore");
const timeSpent = document.getElementById("timeSpent");
const questionResults = document.getElementById("questionResults");
const submitButton = document.getElementById("submitQuiz");
const resetButton = document.getElementById("resetQuiz");


// The quiz lasts ten minutes. //
const quizTimeLimit = 10 * 60;

let startingTime;
let endingTime;
let timerInterval;
let quizSubmitted = false;

// Answer Information used to grade the quiz//
const answers = [
    {
        name:"q1",
        title:"Definition of a server",
        type:"text",
        acceptedAnswers:["server", "a server"],
        correctAnswer:"Server"
    },
    {
        name:"q2",
        title:"Meaning of DNS",
        type:"text",
        acceptedAnswers:["domain name system", "the domain name system"
        ],
        correctAnswer:"Domain Name System"
    },
    {
        name:"q3",
        title:"Server that delivers websites",
        type:"single",
        correctValue: "web",
        correctAnswer:"Web server"
    },
    {
        name:"q4",
        title:"Server that manages organized records",
        type:"single",
        correctValue:"database",
        correctAnswer:"Database server"
    },
    {
        name:"q5",
        title:"Model for requesting server resources",
        type:"single",
        correctValue:"client-server",
        correctAnswer:"Client-server model"
    },
    {
        name:"q6",
        title:"Technology for creating virtual servers",
        type:"single",
        correctValue:"virtualization",
        correctAnswer:"Virtualization"
    },
    {
        name:"q7",
        title:"Internet-based computing resources",
        type:"single",
        correctValue:"cloud",
        correctAnswer:"Cloud Server"
    },
    {
        name:"q8",
        title:"Server used for email",
        type:"single",
        correctValue:"mail",
        correctAnswer:"Mail Server"
    },
    {
        name:"q9",
        title:"Server security practices",
        type:"multiple",
        correctValue:["backups","encryption","firewall"],
        correctAnswer:"Firewall, encryption, and backups"
    },
    {
        name:"q10",
        title:"Server with its own hardware",
        type:"single",
        correctValue:"physical",
        correctAnswer:"Physical Server"
    }
];

//Friendly text for the form values.//
const answerLabels ={
    file: "File server",
    web: "Web server",
    mail: "Mail server",
    game: "Game server",
    proxy: "Proxy server",
    database: "Database server",
    dns: "DNS server",
    peer: "Peer-only model",
    "client-server": "Client server model",
    offline: "Offline model",
    mainframe: "Mainframe-only model",
    encryption: "Encryption",
    virtualization: "Virtualization",
    authentication: "Authentication",
    compression: "Compression",
    physical: "Physical server",
    cloud: "Cloud server",
    print: "Print Server",
    firewall:"Use a firewall",
    "shared-password":"Give every user the same password",
    backups:"Create regular backups",
    virtual:"Virtual Server"
};

//Convert seconds to minutes and seconds.
function formatTime(totalSeconds){
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Calculate and display the time remaining.
function updateTimer() {
    const millisecondsRemaining = endingTime - Date.now();

    const secondsRemaining = Math.max(
        0,
        Math.ceil(millisecondsRemaining / 1000)
    );

    timerDisplay.textContent = formatTime(secondsRemaining);

    if (secondsRemaining <= 60) {
        timerDisplay.parentElement.classList.add("timer-warning");
    }

    if (secondsRemaining === 0) {
        clearInterval(timerInterval);
        gradeQuiz(true);
    }
}

// Start or restart the ten-minute timer.
function startTimer() {
    clearInterval(timerInterval);

    startingTime = Date.now();
    endingTime = startingTime + quizTimeLimit * 1000;

    timerDisplay.parentElement.classList.remove("timer-warning");

    updateTimer();

    timerInterval = setInterval(updateTimer, 250);
}

//Normalize written answers before comparison//
function normalizeText(text){
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, "");
}

//Get an answer selected by the user//
function getUserAnswer(question){
    const control = quizForm.elements[question.name];

    // Read dropdown selections.
    if (control && control.tagName === "SELECT") {
        return control.value;
    }

    // Read typed answers.
    if (question.type === "text") {
        return control.value.trim();
    }

    // Read all selected checkboxes.
    if (question.type === "multiple") {
        return Array.from(
            quizForm.querySelectorAll(
                `input[name="${question.name}"]:checked`
            )
        ).map(input => input.value);
    }

    // Read the selected radio button.
    const selected = quizForm.querySelector(
        `input[name="${question.name}"]:checked`
    );

    return selected ? selected.value : "";

}

//Determine whether an answer is correct.//
function checkAnswer(question,userAnswer){
    if(question.type==="text"){
        const normalizedAnswer = normalizeText(userAnswer);

        return question.acceptedAnswers.some(
            answers => normalizeText(answers)=== normalizedAnswer
        );
    }

    if(question.type==="multiple"){
        const selectedAnswers = [...userAnswer].sort();
        const correctAnswers = [...question.correctValue].sort();

        return(
            selectedAnswers.length === correctAnswers.length &&
            selectedAnswers.every(
                (answer, index) => answer === correctAnswers[index]
            )
        );
    }

    return userAnswer === question.correctValue;
}

//Convert stored values into readable answer text.//
function displayUserAnswer(question, userAnswer){
    if(question.type==="text"){
        return userAnswer || "No answer provided";
    }
    if(question.type==="multiple"){
        if (userAnswer.length ===0){
            return "No answer selected"
        }

        return userAnswer
            .map(answers =>answerLabels[answers] || answers)
            .join(", ");
    }

    return answerLabels[userAnswer] || "No answer selected";
}

//Create the individual results for one question.//
function createQuestionResult(
    question,
    questionNumber,
    userAnswer,
    isCorrect
){
    const resultCard = document.createElement("article");
    resultCard.className = isCorrect
    ? "individual-result correct-result"
    : "individual-result incorrect-result";

    const heading = document.createElement("h4");
    heading.textContent = `Question ${questionNumber}: ${question.title}`;

    const status = document.createElement("p");
    status.className = "answer-status";
    status.textContent = isCorrect
        ? "1/1 point — Correct"
        : "0/1 points — Incorrect";

    const submittedAnswer = document.createElement("p");
    submittedAnswer.textContent =
        `Your answer: ${displayUserAnswer(question, userAnswer)}`;

    const correctAnswer = document.createElement("p");
    correctAnswer.textContent =
        `Correct answer: ${question.correctAnswer}`;

    resultCard.append(
        heading,
        status,
        submittedAnswer,
        correctAnswer
    );

    return resultCard;
}

// Grade all ten questions and display the results.
function gradeQuiz(timeExpired = false) {
    if (quizSubmitted) {
        return;
    }

    quizSubmitted = true;
    clearInterval(timerInterval);

    let score = 0;
    questionResults.innerHTML = "";

    answers.forEach((question, index) => {
        const userAnswer = getUserAnswer(question);
        const isCorrect = checkAnswer(question, userAnswer);

        if (isCorrect) {
            score++;
        }

        const resultCard = createQuestionResult(
            question,
            index + 1,
            userAnswer,
            isCorrect
        );

        questionResults.appendChild(resultCard);
    });

    const percentage = Math.round(
        (score / answers.length) * 100
    );

    const elapsedSeconds = timeExpired
        ? quizTimeLimit
        : Math.min(
            quizTimeLimit,
            Math.floor((Date.now() - startingTime) / 1000)
        );

    const passed = percentage >= 70;

    resultsPanel.hidden = false;
    resultsPanel.classList.remove("passed", "failed");
    resultsPanel.classList.add(passed ? "passed" : "failed");

    overallResult.textContent = timeExpired
        ? `${passed ? "Passed" : "Failed"} — Time Expired`
        : passed
            ? "You Passed!"
            : "You Did Not Pass";

    totalScore.textContent = `${score} out of ${answers.length}`;
    percentageScore.textContent = `${percentage}%`;
    timeSpent.textContent = formatTime(elapsedSeconds);

    // Prevent answers from being changed after submission.
    quizForm
        .querySelectorAll("input, select")
        .forEach(control => {
            control.disabled = true;
        });

    submitButton.disabled = true;

    resultsPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Check required fields before a manual submission.
quizForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const selectedSecurityAnswers = quizForm.querySelectorAll(
        'input[name="q9"]:checked'
    );

    if (selectedSecurityAnswers.length === 0) {
        alert(
            "Please select at least one answer for Question 9."
        );

        return;
    }

    gradeQuiz(false);
});

// Clear the quiz and restart the timer.
resetButton.addEventListener("click", function () {
    quizForm.reset();

    quizForm
        .querySelectorAll("input, select")
        .forEach(control => {
            control.disabled = false;
        });

    submitButton.disabled = false;
    quizSubmitted = false;

    resultsPanel.hidden = true;
    resultsPanel.classList.remove("passed", "failed");
    questionResults.innerHTML = "";

    startTimer();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// Start the quiz timer when the page loads.
startTimer();
