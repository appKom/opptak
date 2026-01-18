# Opptaksside

This is a web application built with Next.js. It's designed to make the process of applying to committees at Online easier for both the applicants and the committees. This platform helps organize and manage applications, making everything simpler and more straightforward for everyone.

## Getting Started

### Prerequisites

Before you start, make sure you have Node.js and npm/yarn installed on your machine.

### Setup

Clone the repository to your local machine:

```bash
git clone https://github.com/appKom/cappelini.git
```

Navigate into the project directory:

```bash
cd cappelini
```

Install the dependencies:

```bash
npm install
# or
yarn install
```

### Environment Variables

Copy the .env.local.template file to .env.local and fill in the necessary environment variables:

```bash
cp .env.local.template .env.local
```

For access to the application's environment variables, please contact Appkom at <appkom@online.ntnu.no>.

### Running the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open <http://localhost:3000> with your browser to see the result.

### Running the matching algorithm

*See also https://github.com/appKom/intervjumatching for the implementation of the matching algorithm.*

Setup Python virtual environment:

```bash
cd algorithm
python -m venv ".venv"
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Then, run the file [fetch_applicants_and_committees.py](algorithm/fetch_applicants_and_committees.py):

```bash
python fetch_applicants_and_committees.py
```
