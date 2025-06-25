# Response Review Dashboard

A simple mobile-responsive web app to view, rate, and comment on form responses loaded from Excel or CSV files.

---

## Features

- Upload Excel (.xlsx) or CSV files with form responses
- View responses as vertical cards with questions and answers
- Search and filter responses by respondent name and status
- Rate each response as Approved ✅, Declined ❌, or Tentative 🔵
- Add comments per response per reviewer
- Multiple reviewers supported with separate ratings and comments saved in browser localStorage
- Summary table view showing all reviewers' ratings and comments
- Fully static, no backend required — deploy on GitHub Pages or any static hosting

---

## How to Use

1. Open `index.html` in a modern browser (or deploy via GitHub Pages)
2. Enter your reviewer name (required)
3. Upload your `.xlsx` or `.csv` response file
4. Browse, search, filter, and rate responses
5. Click the "Show Summary Table" button to see all reviewers' ratings and comments in a table
6. Use the "Back to Main Page" button to return to card view

---

## Deployment on GitHub Pages

1. Create a GitHub repository for this project
2. Add and commit all files (`index.html`, `style.css`, `app.js`, `README.md`)
3. Push to the `main` branch
4. Enable GitHub Pages in your repo settings, select branch `main` and root folder
5. Access your live site at `https://your-username.github.io/your-repo-name/`

---

## Notes

- Ratings and comments are saved **locally in your browser** using `localStorage`. Different users on different browsers/devices will have separate data.
- For shared multi-user data, a backend or cloud database integration would be needed.
- The app uses [SheetJS](https://sheetjs.com/) to parse Excel and CSV files.

---

## License

MIT License

