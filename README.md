# AI English Learning System

This project is an AI-powered English learning dashboard that extracts vocabulary and sentence patterns from YouTube videos.

## Project Structure

- **`web_app/`**: The frontend application (React + Vite). This is what you deploy to Vercel.
- **`study_ai.py`**: The local Python worker that processes YouTube links using Gemini AI.
- **`upload_supabase.py`**: Helper script to upload processed JSON data to Supabase.

## Vercel Deployment (Web App)

1.  Connect this repository to Vercel.
2.  Set the **Root Directory** to `web_app`.
3.  Add the following Environment Variables in Vercel Project Settings:
    -   `VITE_SUPABASE_URL`: Your Supabase URL
    -   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key

## Local Agent Usage (Data Processing)

The Python scripts are designed to run locally on your machine to process videos and update the database.

1.  **Setup Environment**:
    Create a `.env` file in the root directory with:
    ```env
    GOOGLE_API_KEY=your_gemini_key
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_anon_key
    ```

2.  **Add Links**:
    Add YouTube links to `links.csv`.

3.  **Run Agent**:
    ```bash
    python study_ai.py
    ```

## Permissions

-   **Admin System**: Login via the UI to manage videos.
-   **API Quota**: Limits daily imports to protect resources.
