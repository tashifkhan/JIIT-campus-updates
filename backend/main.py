import instaloader
from instaloader.exceptions import ConnectionException, LoginRequiredException
import time
import sys


def main():
    # Initialize with better settings for rate limiting
    L = instaloader.Instaloader(
        download_comments=False,
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        save_metadata=False,
        max_connection_attempts=1,  # Reduce connection attempts
    )

    # Target account
    TARGET = "_pramiti_joshi_"

    try:
        # Try to load existing session first
        try:
            L.load_session_from_file(TARGET)
            print(f"Loaded existing session for {TARGET}")
        except FileNotFoundError:
            # If no session exists, try interactive login
            print("No existing session found. Please login:")
            try:
                L.interactive_login(TARGET)
                print(f"Successfully logged in as {TARGET}")
            except Exception as e:
                print(f"Login failed: {e}")
                print(
                    "Please run this script interactively or provide login credentials"
                )
                sys.exit(1)

        # Load profile
        profile = instaloader.Profile.from_username(L.context, TARGET)
        print(f"Profile loaded: {profile.username} ({profile.full_name})")
        print(f"Followers: {profile.followers}, Following: {profile.followees}")
        print(f"Posts: {profile.mediacount}")
        print("-" * 50)

        # Loop through posts with rate limiting
        post_count = 0
        max_posts = 10  # Limit to first 10 posts to avoid rate limiting

        for post in profile.get_posts():
            try:
                print(f"Post {post_count + 1}:")
                print(f"URL: {post.url}")
                print(f"Date: {post.date}")
                print(f"Likes: {post.likes}")
                print(f"Comments: {post.comments}")

                # Handle caption safely (might be None)
                caption = post.caption if post.caption else "No caption"
                # Truncate long captions
                if len(caption) > 200:
                    caption = caption[:200] + "..."
                print(f"Caption: {caption}")
                print("-" * 50)

                post_count += 1
                if post_count >= max_posts:
                    print(f"Reached limit of {max_posts} posts to avoid rate limiting")
                    break

                # Add delay between requests to avoid rate limiting
                time.sleep(2)

            except ConnectionException as e:
                print(f"Connection error for post: {e}")
                print("Waiting 30 seconds before continuing...")
                time.sleep(30)
                continue
            except Exception as e:
                print(f"Error processing post: {e}")
                continue

    except LoginRequiredException:
        print("Login is required to access this profile. Please run with login.")
        sys.exit(1)
    except ConnectionException as e:
        print(f"Connection error: {e}")
        print("Instagram may be rate limiting. Try again later or with login.")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
