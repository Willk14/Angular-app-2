import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

interface Student {
  id: number;
  name: string;
  marks: number;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard-card">
      <h2>Students</h2>

      <ul class="student-list">
        @for (student of students(); track student.id) {
          <li>{{ student.name }} — {{ student.marks }}</li>
        }
      </ul>

      <div class="summary-grid">
        <div><strong>Total Students:</strong> {{ totalStudents() }}</div>
        <div><strong>Average Marks:</strong> {{ averageMarks() }}</div>
        <div><strong>Highest Marks:</strong> {{ highestMarks() }}</div>
        <div><strong>Lowest Marks:</strong> {{ lowestMarks() }}</div>
      </div>
    </section>
  `,
  styles: [
    `:host { display: block; padding: 1rem; }`,
    `.dashboard-card { max-width: 560px; margin: 0 auto; padding: 1.5rem; border: 1px solid #d0d7de; border-radius: 12px; background: #fff; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }`,
    `.student-list { list-style: none; padding: 0; margin: 0 0 1rem; display: grid; gap: 0.45rem; }`,
    `.summary-grid { display: grid; gap: 0.5rem; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }`
  ]
})
export class StudentDashboardComponent {
  readonly students = signal<Student[]>([
    { id: 1, name: 'John', marks: 85 },
    { id: 2, name: 'Mary', marks: 92 },
    { id: 3, name: 'Jane', marks: 78 }
  ]);

  readonly totalStudents = computed(() => this.students().length);
  readonly averageMarks = computed(() => {
    const items = this.students();
    if (!items.length) return 0;
    return items.reduce((sum, student) => sum + student.marks, 0) / items.length;
  });
  readonly highestMarks = computed(() => Math.max(...this.students().map((student) => student.marks), 0));
  readonly lowestMarks = computed(() => Math.min(...this.students().map((student) => student.marks), 0));
}
