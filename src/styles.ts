export function addStyles() {
  const style = document.createElement("style");
  style.textContent = `
      .habit-tracker-container {
        margin: 1em 0;
        font-family: var(--font-interface);
      }
     
      /* Hide the date header row */
      .habit-tracker-table thead {
        display: none;
      }
     
      /* Convert table to responsive grid layout */
      .habit-tracker-table {
        display: grid;
        grid-template-columns: minmax(180px, auto) repeat(auto-fit, minmax(40px, 1fr));
        gap: 2px;
        background: var(--background-primary);
        border-radius: 6px;
        padding: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        max-width: 100%;
        overflow-x: auto;
      }
     
      /* For horizontal layout: habit names + date cells */
      .habit-tracker-table.horizontal-layout {
        grid-template-columns: minmax(180px, auto) repeat(auto-fit, minmax(40px, 1fr));
      }
     
      /* For vertical layout: date names + habit cells */
      .habit-tracker-table.vertical-layout {
        grid-template-columns: minmax(80px, auto) repeat(auto-fit, minmax(40px, 1fr));
      }
     
      /* Special layout for goal habit tracking (no habit names column) */
      .habit-tracker-table.goal-habit-tracking {
        grid-template-columns: repeat(5, 1fr);
        gap: 1px;
        padding: 4px;
      }
     
      .habit-tracker-table.goal-habit-tracking .habit-cell {
        min-width: 16px;
        min-height: 16px;
        max-width: 24px;
        max-height: 24px;
        font-size: 0.7em;
      }
     
      /* Special layout for modals (more columns for better visibility) */
      .habit-tracker-table.modal-layout {
        grid-template-columns: minmax(120px, auto) repeat(7, 1fr);
        gap: 2px;
        padding: 8px;
      }
     
      .habit-tracker-table.modal-layout.horizontal-layout {
        grid-template-columns: minmax(120px, auto) repeat(7, 1fr);
      }
     
      .habit-tracker-table.modal-layout.vertical-layout {
        grid-template-columns: minmax(80px, auto) repeat(7, 1fr);
      }
     
      /* Hide table elements that don't work with grid */
      .habit-tracker-table tbody,
      .habit-tracker-table tr,
      .habit-tracker-table td {
        display: contents;
      }
     
      /* Habit name cell styling */
      .habit-name {
        cursor: pointer;
        font-weight: 500;
        padding: 8px 12px;
        transition: background-color 0.2s ease;
        background: var(--background-secondary);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        min-height: 30px;
        font-size: 0.85em;
        word-break: break-word;
        line-height: 1.2;
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
        max-width: none;
        width: 100%;
      }
      .habit-name:hover {
        background-color: var(--background-modifier-hover);
      }
      .habit-group {
        color: var(--text-accent);
        font-weight: 600;
      }
      .habit-group:hover {
        background-color: var(--background-modifier-hover);
      }
      .habit-cell.highlight {
        animation: highlight 2s ease-out;
      }
      @keyframes highlight {
        0% { background-color: var(--background-modifier-active); }
        100% { background-color: transparent; }
      }
      .habit-tracker-table-wrapper {
        position: relative;
      }
      .habit-refresh-btn {
        position: absolute;
        top: 0.5em;
        right: 0.5em;
        z-index: 2;
        background: var(--background-secondary-alt);
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        font-size: 1.2em;
        color: var(--text-accent);
        cursor: pointer;
        transition: background 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      }
      .habit-refresh-btn:hover {
        background: var(--background-modifier-hover);
      }
     
      /* Responsive habit cells */
      .habit-cell {
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 4px;
        min-width: 24px;
        min-height: 24px;
        max-width: 40px;
        max-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9em;
        font-weight: bold;
        aspect-ratio: 1;
      }
     
      .habit-cell:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 1;
      }
     
      .habit-cell.success {
        background: rgba(34, 197, 94, 0.2);
        color: var(--color-green);
      }
      .habit-cell.fail {
        background: rgba(239, 68, 68, 0.2);
        color: var(--color-red);
      }
      .habit-cell.todo {
        background: rgb(193, 216, 255);
        color: var(--color-blue);
      }
      .habit-cell.neutral {
        background: rgba(156, 163, 175, 0.2);
        color: var(--text-muted);
      }
     
      /* Responsive breakpoints */
      @media (max-width: 1024px) {
        .habit-tracker-table {
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          padding: 4px;
        }
       
        .habit-tracker-table.horizontal-layout {
          grid-template-columns: minmax(100px, auto) repeat(2, 1fr);
        }
       
        .habit-tracker-table.vertical-layout {
          grid-template-columns: minmax(70px, auto) repeat(2, 1fr);
        }
       
        .habit-cell {
          min-width: 20px;
          min-height: 20px;
          max-width: 32px;
          max-height: 32px;
          font-size: 0.8em;
        }
       
        .habit-name {
          font-size: 0.8em;
          padding: 6px 8px;
          min-height: 24px;
        }
      }
     
      @media (max-width: 768px) {
        .habit-tracker-table {
          grid-template-columns: repeat(1, 1fr);
          gap: 1px;
          padding: 2px;
        }
       
        .habit-tracker-table.horizontal-layout {
          grid-template-columns: minmax(80px, auto) repeat(1, 1fr);
        }
       
        .habit-tracker-table.vertical-layout {
          grid-template-columns: minmax(60px, auto) repeat(1, 1fr);
        }
       
        .habit-cell {
          min-width: 18px;
          min-height: 18px;
          max-width: 28px;
          max-height: 28px;
          font-size: 0.75em;
        }
       
        .habit-name {
          font-size: 0.75em;
          padding: 4px 6px;
          min-height: 20px;
        }
      }
      .habit-detail-modal .modal-content {
        padding: 2em;
        max-width: 500px;
      }
      .habit-contexts {
        margin: 1em 0;
        padding: 1em;
        background: var(--background-secondary);
        border-radius: 6px;
      }
      .habit-contexts ul {
        margin: 0.5em 0;
        list-style-type: disc;
        padding-left: 1.5em;
      }
      .habit-contexts li {
        margin: 0.25em 0;
        padding: 0.25em 0;
      }
      .habit-actions {
        margin-top: 1.5em;
        display: flex;
        gap: 0.5em;
        flex-wrap: wrap;
      }
      .habit-actions button {
        padding: 0.5em 1em;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      .habit-open-note-btn {
        background: var(--background-modifier-border);
        color: var(--text-normal);
      }
      .habit-actions button:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .habit-stats {
        margin-top: 1em;
        padding: 1em;
        background: var(--background-secondary);
        border-radius: 6px;
        display: flex;
        justify-content: space-around;
        text-align: center;
      }
      .habit-stat {
        display: flex;
        flex-direction: column;
      }
      .habit-stat-number {
        font-size: 1.5em;
        font-weight: bold;
        color: var(--text-accent);
      }
      .habit-stat-label {
        font-size: 0.9em;
        color: var(--text-muted);
      }
      /* Tag List Styles */
      .habit-tags, .group-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5em;
        margin: 0.5em 0;
      }
      .habit-tag {
        background: var(--background-secondary);
        color: var(--text-normal);
        padding: 0.3em 0.8em;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.9em;
        transition: background 0.2s;
      }
      .habit-tag:hover {
        background: var(--background-modifier-border-hover);
      }
      .group-tag {
        margin: 0.5em 0;
      }
      .habit-group-list {
        list-style: none;
        padding: 0;
        margin: 1em 0;
      }
      .habit-group-member {
        display: block;
        width: 100%;
        padding: 8px 12px;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-normal);
        font-family: var(--font-interface);
        font-size: 1em;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }
      .habit-group-member:hover {
        background-color: var(--background-modifier-hover);
      }
      .group-name {
        background: var(--background-secondary-alt);
        color: var(--text-accent);
        padding: 0.3em 0.8em;
        border-radius: 12px;
        cursor: pointer;
        font-size: 1em;
        font-weight: 500;
        margin-right: 0.5em;
      }
      .group-name:hover {
        background: var(--background-modifier-border-hover);
      }
      .member-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5em;
        margin-left: 1em;
        margin-top: 0.3em;
      }
      /* Goals Styles */
      .goals-container {
        margin: 1rem 0;
      }
      .goal-card {
        min-height: 200px;
        display: flex;
        flex-direction: column;
      }
      .goal-card:hover {
        border-color: var(--text-accent);
      }
      .goal-title {
        word-break: break-word;
        hyphens: auto;
      }
      .goal-properties {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .goal-why,
      .goal-next,
      .goal-rank {
        word-break: break-word;
        line-height: 1.4;
      }
      .goals-empty-message {
        padding: 2rem;
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
      }
      .goals-error {
        color: var(--text-error);
        padding: 1rem;
        background: var(--background-modifier-error);
        border-radius: 6px;
        margin: 1rem 0;
      }
      @media (max-width: 768px) {
        .goals-container {
          grid-template-columns: 1fr !important;
        }
      }
      /* Goal Summary Styles */
      .goal-summary-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .goal-summary-number {
        font-size: 1.5em;
        font-weight: bold;
        color: var(--text-accent);
      }
      .goal-summary-label {
        font-size: 0.9em;
        color: var(--text-muted);
        margin-top: 0.25rem;
      }
      /* Goal Overview Modal Styles */
      .goal-overview-modal .modal-content {
        padding: 2em;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
      }
      .goal-overview-header {
        margin-bottom: 1.5rem;
        border-bottom: 1px solid var(--background-modifier-border);
        padding-bottom: 1rem;
      }
      .goal-overview-header h2 {
        margin: 0;
        color: var(--text-normal);
      }
      .goal-wiki-link {
        color: var(--text-accent);
        text-decoration: none;
      }
      .goal-wiki-link:hover {
        text-decoration: underline;
      }
      .goal-overview-properties {
        margin-bottom: 2rem;
        padding: 1rem;
        background: var(--background-secondary);
        border-radius: 6px;
      }
      .goal-overview-row {
        margin: 0.5rem 0;
        display: flex;
        align-items: flex-start;
      }
      .goal-overview-label {
        font-weight: 600;
        color: var(--text-accent);
        min-width: 80px;
        margin-right: 0.5rem;
      }
      .goal-overview-value {
        color: var(--text-normal);
        flex: 1;
        word-break: break-word;
      }
      .goal-no-habits {
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
        padding: 2rem;
      }
      .goal-error {
        color: var(--text-error);
        padding: 1rem;
        background: var(--background-modifier-error);
        border-radius: 6px;
        margin: 1rem 0;
      }
      /* Goal Habit Tracker Styles */
      .goal-habit-summary {
        margin-top: 0.75rem;
        border-top: 1px solid var(--background-modifier-border);
        padding-top: 0.75rem;
      }
      .goal-habit-summary .habit-header {
        font-size: 0.9em;
        font-weight: 600;
        color: var(--text-normal);
        margin-bottom: 0.5rem;
      }
      .goal-habit-summary table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8em;
      }
      .goal-habit-summary th {
        text-align: center;
        padding: 0.25rem;
        border-bottom: 1px solid var(--background-modifier-border);
        font-weight: 600;
        font-size: 0.7em;
      }
      .goal-habit-summary th:first-child {
        text-align: left;
      }
      .goal-habit-summary td {
        padding: 0.25rem;
        border-bottom: 1px solid var(--background-modifier-border);
        font-size: 0.8em;
      }
      .goal-habit-summary td:first-child {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .goal-habit-summary .habit-cell {
        font-weight: bold;
        color: var(--text-muted);
        text-align: center;
      }
      .goal-habit-summary .habit-cell.success {
        color: var(--color-green);
      }
      .goal-habit-summary .habit-cell.fail {
        color: var(--color-red);
      }
      .goal-habit-summary .habit-cell.todo {
        color: var(--color-blue);
      }
     
      /* Responsive styles for goal habit summary */
      @media (max-width: 1024px) {
        .goal-habit-summary table {
          font-size: 0.7em;
        }
       
        .goal-habit-summary th,
        .goal-habit-summary td {
          padding: 0.2rem;
          font-size: 0.7em;
        }
       
        .goal-habit-summary td:first-child {
          max-width: 80px;
        }
      }
     
      @media (max-width: 768px) {
        .goal-habit-summary table {
          font-size: 0.65em;
        }
       
        .goal-habit-summary th,
        .goal-habit-summary td {
          padding: 0.15rem;
          font-size: 0.65em;
        }
       
        .goal-habit-summary td:first-child {
          max-width: 60px;
        }
       
        .goal-habit-summary .habit-header {
          font-size: 0.8em;
        }
      }
    `;
  document.head.appendChild(style);
}