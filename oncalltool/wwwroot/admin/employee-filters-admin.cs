/* Employee filters only — preserves the existing Admin page layout. */
.employee - filters {
display: grid;
    grid - template - columns: minmax(0, 1.7fr) minmax(190px, 1fr);
gap: 16px;
    align - items: end;
margin: 0 0 10px;
}

.employee - filter - field {
display: flex;
    flex - direction: column;
gap: 8px;
    min - width: 0;
color: var(--ink);
    font - size: 12px;
    font - weight: 700;
}

.employee - filter - field input,
.employee-filter-field select {
    width: 100 %;
min - width: 0;
height: 45px;
padding: 10px 13px;
border: 1px solid #dfe3ee;
    border - radius: 9px;
background: white;
color: var(--ink);
font - size: 13px;
}

.employee - filter - field input: focus,
.employee - filter - field select: focus {
outline: 2px solid rgba(255, 121, 0, .2);
    border - color: var(--orange);
}

.employee - filter - meta {
    min - height: 26px;
display: flex;
    justify - content: space - between;
    align - items: center;
gap: 12px;
margin: 0 0 8px;
color: var(--muted);
    font - size: 12px;
}

.employee - filter - clear {
border: 0;
background: transparent;
color: var(--orange);
padding: 4px;
    font - size: 12px;
    font - weight: 700;
}

.employee - filter - clear:hover {
    text-decoration: underline;
}

.employee - filter - empty {
    text - align: center;
padding: 28px 14px;
color: var(--muted);
}

@media(max - width: 700px) {
    .employee - filters {
        grid - template - columns: 1fr;
    gap: 12px;
    }
}
