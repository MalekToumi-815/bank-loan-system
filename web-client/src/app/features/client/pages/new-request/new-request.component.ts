import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { ClientLoanService } from '../../services/client-loan.service';
import { FormatRolePipe } from '../../../../shared/pipes/format-role.pipe';

interface NewLoanForm {
  amount: number | null;
  type: 'PERSONAL_LOAN' | 'HOME_LOAN' | 'CAR_LOAN' | 'BUSINESS_LOAN' | 'STUDENT_LOAN' | 'RENOVATION_LOAN' | 'AGRICULTURAL_LOAN';
  durationMonths: number | null;
}

@Component({
  selector: 'app-new-request',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatRolePipe],
  styleUrl: './new-request.component.css',
  template: `
    <section class="new-loan-page">
      <div class="new-loan-head">
        <div>
          <p class="new-loan-kicker">Client Workspace</p>
          <h1 class="new-loan-title">New Loan Request</h1>
        </div>
      </div>

      <div class="new-loan-layout">
        <section class="new-loan-card">
          <div class="new-loan-card-header">
            <h2>Loan application</h2>
            <span class="new-loan-badge">Workflow</span>
          </div>

          <form class="new-loan-form" (ngSubmit)="submitLoan()">
            <div class="new-loan-field">
              <label for="amount">Amount</label>
              <input
                id="amount"
                type="number"
                min="1"
                class="new-loan-input"
                [(ngModel)]="form().amount"
                name="amount"
                placeholder="e.g. 25000"
              />
            </div>

            <div class="new-loan-field">
              <label for="type">Loan type</label>
              <select id="type" class="new-loan-input" [(ngModel)]="form().type" name="type">
                <option value="PERSONAL_LOAN">PERSONAL LOAN</option>
                <option value="HOME_LOAN">HOME LOAN</option>
                <option value="CAR_LOAN">CAR LOAN</option>
                <option value="BUSINESS_LOAN">BUSINESS LOAN</option>
                <option value="STUDENT_LOAN">STUDENT LOAN</option>
                <option value="RENOVATION_LOAN">RENOVATION LOAN</option>
                <option value="AGRICULTURAL_LOAN">AGRICULTURAL LOAN</option>
              </select>
            </div>

            <div class="new-loan-field">
              <label for="durationMonths">Duration (months)</label>
              <input
                id="durationMonths"
                type="number"
                min="1"
                class="new-loan-input"
                [(ngModel)]="form().durationMonths"
                name="durationMonths"
                placeholder="e.g. 50"
              />
            </div>

            <div class="new-loan-actions">
              <button class="new-loan-button" type="submit">Submit request</button>
            </div>
          </form>

          @if (message()) {
            <div class="new-loan-message" [class.error]="messageType() === 'error'">
              {{ message() }}
            </div>
          }
        </section>

        <aside class="new-loan-side-card">
          <h2>Request summary</h2>
          <div class="new-loan-meta-list">
            <div class="new-loan-meta-row">
              <span>Client ID</span>
              <strong>{{ currentUser()?.id ?? '—' }}</strong>
            </div>
            <div class="new-loan-meta-row">
              <span>Selected type</span>
              <strong>{{ form().type | formatRole }}</strong>
            </div>
            <div class="new-loan-meta-row">
              <span>Requested amount</span>
              <strong>{{ formatAmount(form().amount) }}</strong>
            </div>
            <div class="new-loan-meta-row">
              <span>Duration</span>
              <strong>{{ formatDuration(form().durationMonths) }}</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `
})
export class NewRequestComponent {
  private loanService = inject(ClientLoanService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  form = signal<NewLoanForm>({
    amount: null,
    type: 'HOME_LOAN',
    durationMonths: null
  });

  message = signal('');
  messageType = signal<'success' | 'error' | ''>('');

  submitLoan() {
    const user = this.currentUser();
    if (!user?.id) {
      this.setMessage('Your session is not ready yet. Please sign in again.', 'error');
      return;
    }

    const amount = Number(this.form().amount);
    const durationMonths = Number(this.form().durationMonths);

    if (!amount || !durationMonths) {
      this.setMessage('Please complete the amount and duration fields.', 'error');
      return;
    }

    this.loanService.startLoanRequest({
      amount,
      type: this.form().type,
      durationMonths
    }).subscribe({
      next: () => {
        this.setMessage('Loan request submitted successfully.', 'success');
        this.form.set({
          amount: null,
          type: 'HOME_LOAN',
          durationMonths: null
        });

        setTimeout(() => {
          this.router.navigate(['/dashboard/my-loans']);
        }, 900);
      },
      error: () => {
        this.setMessage('Unable to submit the loan request right now.', 'error');
      }
    });
  }

  private setMessage(message: string, type: 'success' | 'error') {
    this.message.set(message);
    this.messageType.set(type);
  }

  formatAmount(value: number | null): string {
    if (value == null || value === 0) {
      return '—';
    }

    return `${value.toLocaleString()} DT`;
  }

  formatDuration(value: number | null): string {
    if (value == null || value === 0) {
      return '—';
    }

    return `${value} months`;
  }
}
