# JIIT Campus Updates

[![Astro](https://img.shields.io/badge/Frontend-Astro-FF5D01?logo=astro&logoColor=white)](https://astro.build/)  
[![Bun](https://img.shields.io/badge/Runtime-Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)  
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)  
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)  
[![LangChain](https://img.shields.io/badge/AI-LangChain-1C3C3C)](https://www.langchain.com/)  
[![LangGraph](https://img.shields.io/badge/AI-LangGraph-1C3C3C)](https://www.langchain.com/langgraph)  
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![Daily Updates](https://img.shields.io/badge/Updates-Daily%20at%209%20AM%20IST-brightgreen)](#update-schedule)  
[![Deployment Status](https://img.shields.io/badge/Status-Active-success)](#)  

---

**JIIT Campus Updates** is a centralized web platform designed to keep students informed about the latest placement opportunities and campus activities at Jaypee Institute of Information Technology (JIIT).  
The platform automatically refreshes its data every day at **9:00 AM IST**, ensuring that students always have access to the most recent updates.

---

## Features

- **Placement Updates**  
  Stay informed about ongoing and upcoming placement drives, company visits, and recruitment announcements.

- **Campus Activity Updates**  
  View details of events, workshops, competitions, and activities organized by various hubs and societies.

- **Automated Daily Refresh**  
  Data is updated automatically at 9:00 AM IST using backend automation.

- **Search and Filter**  
  Quickly find relevant updates using search and category filters.

---

## Tech Stack

**Frontend**  
- [Astro](https://astro.build/) – Static site generation and modern frontend framework  
- [Bun](https://bun.sh/) – Fast JavaScript runtime and package manager

**Backend**  
- [Python](https://www.python.org/)  
- [FastAPI](https://fastapi.tiangolo.com/) – High-performance API framework  
- [MongoDB](https://www.mongodb.com/) – NoSQL database for storing updates  
- [LangChain](https://www.langchain.com/) – AI-powered data processing and automation  
- [LangGraph](https://www.langchain.com/langgraph) – Workflow orchestration for AI pipelines

**Automation**  
- Cron jobs for scheduled daily refresh

---

## Installation

### Prerequisites
- [Bun](https://bun.sh/) (v1.0 or later)
- Python (3.10 or later)
- MongoDB instance (local or cloud)
- Git

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/jiit-campus-updates.git
   cd jiit-campus-updates
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   bun install
   ```

4. **Environment Variables**  
   Create a `.env` file in both `backend` and `frontend` directories with the required configuration:
   ```
   MONGODB_URI=your_mongodb_connection_string
   LANGCHAIN_API_KEY=your_langchain_api_key
   ```

5. **Run Backend**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

6. **Run Frontend**
   ```bash
   cd frontend
   bun run dev
   ```

---

## Project Structure

```
jiit-campus-updates/
│
├── backend/               # FastAPI backend
│   ├── main.py             # API entry point
│   ├── services/           # Business logic
│   ├── models/             # MongoDB models
│   ├── utils/              # Helper functions
│   └── requirements.txt
│
├── frontend/               # Astro frontend
│   ├── src/                # Pages and components
│   ├── public/             # Static assets
│   └── bun.lockb
│
└── README.md
```

---

## Update Schedule

The backend uses a scheduled job to fetch and update placement and campus activity data every day at **9:00 AM IST**.  
This ensures that the platform always displays the latest information.

---

## Contributing

Contributions are welcome. Please fork the repository and submit a pull request with your changes.  
For major changes, open an issue first to discuss what you would like to change.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
