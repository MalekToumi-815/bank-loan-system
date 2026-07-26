import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class ClientDashboard {
  private clientService = inject(ClientService);
  public currentUser$ = this.clientService.currentUser$;
}
