Fantasy Football Draft Assistant: Product Requirements Document
Author: Neeraj Sathe
1. Introduction
This document outlines the product requirements for a new web-based application designed to assist fantasy football players during their drafts. The application will provide two primary features: a mock draft simulator and a live draft aid. The goal is to provide users with a powerful tool to practice their draft strategy, receive intelligent player recommendations, and ultimately build a winning fantasy football team. This document will serve as the guiding resource for the design and development of this application.
2. Objective
The primary objective of the Fantasy Football Draft Assistant is to empower fantasy football players with the data and tools necessary to make informed decisions during their drafts. We aim to create a user-friendly and highly interactive experience that helps users feel more prepared and confident on draft day.
Our key business goals are:
- To become a go-to resource for fantasy football draft preparation.
- To build a loyal user base of engaged fantasy football players.
- To create a platform that can be expanded with additional features in the future.
3. Scope
This PRD covers the initial release (Version 1.0) of the Fantasy Football Draft Assistant. The scope is limited to the features and functionalities described within this document.
In Scope:
- Mock Draft Simulator with AI-powered opponents.
- Live Draft Aid for manual entry of draft picks.
- Configurable league settings.
- AI-powered player recommendations.
- Post-draft analysis and team grading.
- Internal player ranking system based on aggregated public data.
Out of Scope for Version 1.0:
- User accounts and authentication.
- Direct integration with third-party fantasy football platforms (e.g., ESPN, Yahoo, Sleeper).
- In-season team management tools.
- Player news and injury updates.
- Mobile application (iOS or Android).
4. User Personas
Primary Persona: "The Dedicated Dabbler"
Name: Alex
Age: 28-40
Occupation: Works a full-time job, but is passionate about fantasy football.
Fantasy Football Experience: 5+ years. Plays in one or two leagues per year, usually with friends or coworkers.
Goals: Wants to win their league and have bragging rights. Wants to feel prepared for the draft and not make panic picks.
Frustrations: Doesn't have hours to spend on deep research. Finds it hard to keep up with all the player news and rankings. Gets overwhelmed during the live draft with the clock ticking.
5. Features
5.1. Feature 1: Draft Configuration
Before starting the mock draft simulator or the live draft aid, the user must be able to configure their draft settings.
Scoring:
- Standard
- PPR (Point Per Reception)
- Half-PPR
Draft Type:
- Snake
- Linear
Draft Position:
- User can select their draft position (1st, 2nd, etc.).
- Option for a random draft position.
Number of Teams:
- Select from 4-32 teams.
Roster Positions:
- User can define the number of players for each position (QB, RB, WR, TE, FLEX, K, D/ST, Bench).
5.2. Feature 2: Mock Draft Simulator
The mock draft simulator will allow users to practice drafting against AI-controlled opponents.
5.2.1. Interactive Mock Draft
The user will participate in a turn-based draft.
When it is the user's turn to pick, the application will display a list of available players.
The user can filter and sort the player list by position, rank, and other key stats.
The user selects a player to draft to their team.
5.2.2. AI-Powered Recommendations
At each of the user's picks, the application will provide a list of recommended players.
Recommendations will be based on:
- The internal player ranking system.
- The user's current roster composition and needs.
- The "best player available" (BPA) strategy.
- Positional scarcity.
5.2.3. AI Bot for Opponents
All non-user teams will have their picks made by an AI bot.
The AI bot will make selections based on the internal player rankings and team needs.
The AI's drafting logic should be varied to simulate a realistic draft with different opponent strategies.
5.2.4. Post-Draft Analysis
Upon completion of the draft, the user will receive a detailed analysis of their team, relative to all other drafted teams. This analysis should be performed by AI that takes into account the internal player ranking system and team needs.
- Team Grade: An overall numerical grade out of 100 points for the user's drafted team.
- Positional Analysis: A breakdown of the strengths and weaknesses of each position group and that position group’s relative ranking compared to that position group for all other drafted teams.
- Projected Standings: A projection of how the user's team will rank against the other teams in the league.
- Pick Analysis: An analysis of each pick the user made and alternative players the user should have considered selecting at that pick.
- Additional Insight: Identify any top players at their respective position on the user’s team, any sleeper (players who are drafted well below their average draft position) players drafted, and bye week analysis.
5.3. Feature 3: Live Draft Aid
The live draft aid will assist users during their actual fantasy football drafts on third-party platforms.
5.3.1. Manual Entry of Draft Picks
The user will manually input the draft selections for all teams in their league as they happen.
The interface will feature a draft board where the user can input the player selected for each pick.
As players are selected, they will be removed from the list of available players.
5.3.2. Real-time Player Recommendations
The application will provide real-time player recommendations to the user when it is their turn to pick.
The recommendation engine will be the same as in the mock draft simulator, providing suggestions based on the current state of the draft.
6. System Architecture
This section outlines the proposed technical architecture for Version 1.0 of the Fantasy Football Draft Assistant. The design prioritizes a rapid development cycle for a local MVP.
- Frontend (Client-Side): A single-page application (SPA) built with the React framework. This choice enables the creation of a highly interactive and responsive user interface, which is critical for both the mock draft simulator and the live draft aid features. Chakra UI should be used for pre-built, accessible UI components.
- Backend (Server-Side): A REST API developed with FastAPI. FastAPI is a modern, high-performance Python framework chosen for its speed and developer-friendly features, including automatic data validation and API documentation. The backend will handle the application's core logic and data processing.
- Database: A PostgreSQL database will be used to store and manage the internal player ranking data aggregated from public sources.  For local development, this can be run easily within a Docker container.
- Data Aggregation: A scheduled Python script will be responsible for periodically collecting and updating player rankings from the various specified sources to ensure data is current.
7. Data Requirements
The application's player rankings will be the foundation of the AI recommendations.
Player rankings will be aggregated from a variety of public sources, including:
- FantasyPros (Expert Consensus Rankings)
- Pro Football Focus (PFF)
- ESPN
- Sleeper
- Yahoo Fantasy
- Reddit
8. Non-Functional Requirements
- Performance: The application should be fast and responsive, with minimal loading times, especially during the interactive draft.
- Usability: The user interface should be intuitive and easy to navigate for users of all technical skill levels.
- Reliability: The application should be stable and available, with minimal downtime.
- Scalability: The application should be able to handle a large number of concurrent users, especially during peak fantasy football draft season.
9. Prioritization (MoSCoW Method)
Must-Have:
- Mock Draft Simulator
- Configurable League Settings
- AI-Powered Recommendations
- AI Bot for Opponents
- Live Draft Aid
- Internal Player Ranking System
- Post-Draft Analysis with Team Grade
Should-Have:
- Ability to save and view past mock drafts.
- User accounts to save league settings and preferences.
Could-Have:
- More advanced AI opponent logic (e.g., "homer" picks, position hoarding).
- System to regularly update these rankings to ensure they are current.
Won't-Have (for V1.0):
- Direct integration with fantasy platforms.
- Auction draft support.
- Keeper league support.
10. Stretch Goals (Future Versions)
Deeper Player Analysis: Include more detailed player stats, projections, and news.
Trade Analyzer: A tool to help users evaluate potential trades.
Waiver Wire Assistant: Recommendations for in-season player pickups.
Community Features: User forums, comment sections, and the ability to share mock draft results.
11. Success Metrics
The success of the Fantasy Football Draft Assistant will be measured by the following key performance indicators (KPIs):
User Engagement:
- Number of mock drafts completed.
- Number of live drafts assisted.
- Average time spent on the site.
User Retention:
- Percentage of users who return to the site.
User Satisfaction:
- User feedback and reviews.
- Net Promoter Score (NPS).
