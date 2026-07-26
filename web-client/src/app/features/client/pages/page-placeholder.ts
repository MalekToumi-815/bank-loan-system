import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-client-page-placeholder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-placeholder.html',
  styleUrls: ['./page-placeholder.css']
})
export class ClientPagePlaceholder {
  private route = inject(ActivatedRoute);

  title = this.route.snapshot.data['title'] as string ?? 'Page';
  description = this.route.snapshot.data['description'] as string ?? 'This page is under construction.';
}
